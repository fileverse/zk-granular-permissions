import {
  encodeFunctionData,
  Hex,
  hexToBytes,
  keccak256,
  PublicClient,
} from "viem";

import { generateMerkleTree, getProofBytes } from "./merkle-tree";

import {
  aesKeyFromVOPRFOutput,
  encryptMerkleTree,
  encryptPermissionMap,
} from "./encryption";
import { toUint8Array } from "js-base64";

import { aesEncrypt } from "@fileverse/crypto/webcrypto";
import { VOPRFManager } from "../voprf";
import {
  EncryptionKeyTree,
  FileRole,
  PermissionRegistryType,
  PermissionContractCallArgs,
  InitialisePermissionCallArgs,
  EncryptionKeyEntry,
  PublicPermissionContent,
  PermissionType,
  PermissionMapItem,
  PermissionContent,
} from "./types";

import { PERMISSIONS_ABI } from "../contracts/abis/permissions-contract-abi";

import { SimpleMerkleTree } from "@openzeppelin/merkle-tree";

import { cid as isValidCid } from "is-ipfs";

export const getCurrentFilePermission = async (
  fileId: number,
  permissionAddress: Hex,
  publicClient: PublicClient
) => {
  const existingPermission = await publicClient.readContract({
    abi: PERMISSIONS_ABI,
    address: permissionAddress,
    functionName: "getFilePermission",
    args: [fileId],
  });

  return existingPermission as [string, PermissionRegistryType, Hex];
};

/**
 * Creates an encryption key tree entry for a given identifier
 */
const createEncryptionKeyEntry = async (
  identifier: string,
  merkleTree: SimpleMerkleTree,
  currentPermissionType: PermissionType,
  privateKey: Hex,
  voprfManager: VOPRFManager,
  fileKey: string,
  commentKey: string
) => {
  const proofBytes = getProofBytes(merkleTree, identifier);
  const output = await voprfManager.processInput(proofBytes);
  const treeKey = keccak256(proofBytes);
  const { aesKey, salt } = await aesKeyFromVOPRFOutput(output);

  const keyEntry: EncryptionKeyEntry = {
    encryptedFileKey: await aesEncrypt(aesKey, toUint8Array(fileKey), "base64"),
    salt,
    encryptedAgentKey: await aesEncrypt(
      aesKey,
      hexToBytes(privateKey),
      "base64"
    ),
  };

  if (currentPermissionType === PermissionType.PrivateComment) {
    keyEntry.encryptedCommentKey = await aesEncrypt(
      aesKey,
      toUint8Array(commentKey),
      "base64"
    );
  }

  return { treeKey, keyEntry };
};

/**
 * Builds the encryption key tree for all permissions
 */
const buildEncryptionKeyTree = async (
  permissionsArray: PermissionMapItem[],
  merkleTree: SimpleMerkleTree,
  fileKey: string,
  commentKey: string,
  voprfManager: VOPRFManager,
  currentPermissionType: PermissionType
): Promise<EncryptionKeyTree> => {
  const encryptionKeyTree = {} as EncryptionKeyTree;

  for (let i = 0; i < permissionsArray.length; i++) {
    const identifier = permissionsArray[i];
    if (!identifier) throw new Error("Identifier not found");

    const { treeKey, keyEntry } = await createEncryptionKeyEntry(
      identifier.type === "email" ? identifier.value : identifier.address,
      merkleTree,
      currentPermissionType,
      identifier.agentKey,
      voprfManager,
      fileKey,
      commentKey
    );

    encryptionKeyTree[treeKey] = keyEntry;
  }

  return encryptionKeyTree;
};

/**
 * Creates and uploads permission JSON to IPFS
 */
const createPermissionJSON = async (
  merkleTree: SimpleMerkleTree,
  permissionMap: Record<string, PermissionMapItem>,
  encryptionKeyTree: EncryptionKeyTree,
  secretKey: Uint8Array,
  encryptionCallback: (data: Uint8Array) => string
) => {
  const encryptedMerkleTree = encryptMerkleTree(merkleTree, secretKey);
  const encryptedPermissionMap = encryptPermissionMap(
    permissionMap,
    encryptionCallback
  );

  const permissionJSON = {
    permissionTree: encryptedMerkleTree,
    ownerPermissionSet: encryptedPermissionMap,
    encryptionKeyTree,
  };

  return permissionJSON;
};

export const prepareInitialisePermissionCallData = async (
  args: PermissionContractCallArgs,
  uploadFn: (data: unknown) => Promise<string>
) => {
  const {
    fileId,
    currentPermissionType,
    permissionMap,
    fileKey,
    commentKey,
    voprfManager,
    secretKey,
    encryptionCallback,
  } = args;

  // Generate merkle tree from permissions
  const permissionsArray = Object.values(permissionMap);

  const merkleTree = await generateMerkleTree(
    permissionsArray.map((item) => {
      if (item.type === "email")
        return item.value; // for email address we use the email address as the identifier
      else return item.address; // for ens and wallet we use address as the identifier
    })
  );

  // Build encryption key tree
  const encryptionKeyTree = await buildEncryptionKeyTree(
    permissionsArray,
    merkleTree,
    fileKey,
    commentKey,
    voprfManager,
    currentPermissionType
  );

  const permissionJSON = await createPermissionJSON(
    merkleTree,
    permissionMap,
    encryptionKeyTree,
    secretKey,
    encryptionCallback
  );

  const permissionIPFSHash = await uploadFn(permissionJSON);

  if (!isValidCid(permissionIPFSHash)) throw new Error("Invalid IPFS hash");

  const encodedCallData = getInitialisePermissionCallData({
    fileId,
    metadataHash: permissionIPFSHash,
    registryType: PermissionRegistryType.PRIVATE, // Should always be private for now
    smartAccountAddresses: permissionsArray.map((item) => item.agentAddress),
    currentPermissionType,
  });

  return {
    permissionIPFSHash,
    encodedCallData,
  };
};

const getFileRole = (currentPermissionType: PermissionType) => {
  switch (currentPermissionType) {
    case PermissionType.PrivateComment:
      return FileRole.COMMENT;
    case PermissionType.PrivateEdit:
      return FileRole.EDIT;
    default:
      return FileRole.VIEW;
  }
};

export const getInitialisePermissionCallData = (
  args: InitialisePermissionCallArgs
) => {
  const {
    fileId,
    metadataHash,
    registryType,
    smartAccountAddresses,
    currentPermissionType,
  } = args;
  const addressToEncodeWithPermission = [];
  const fileRole = getFileRole(currentPermissionType);
  for (const smartAccountAddress of smartAccountAddresses) {
    addressToEncodeWithPermission.push([smartAccountAddress, fileRole]);
  }
  const encodedCallData = encodeFunctionData({
    abi: PERMISSIONS_ABI,
    functionName: "initializeFilePermission",
    args: [
      fileId,
      metadataHash,
      registryType,
      addressToEncodeWithPermission,
      true,
    ],
  });

  return encodedCallData;
};

export const loadPermissionContent = async (
  permissionAddress: Hex,
  fileId: number,
  publicClient: PublicClient,
  fetchFn: (hash: string) => Promise<unknown>
) => {
  const [permissionContentHash] = (await publicClient.readContract({
    abi: PERMISSIONS_ABI,
    address: permissionAddress,
    functionName: "getFilePermission",
    args: [fileId],
  })) as [string, PermissionRegistryType, Hex];

  const permissionContent = (await fetchFn(
    permissionContentHash
  )) as PublicPermissionContent;

  return permissionContent;
};

export const preparePermissionUpdateExecRequest = async (
  args: PermissionContractCallArgs,
  uploadFn: (data: unknown) => Promise<string>
) => {
  if (!args.permissionMap || Object.keys(args.permissionMap).length === 0)
    throw new Error(
      "Invalid permission map, atleast one item is required in permission map"
    );

  const { permissionIPFSHash, encodedCallData } =
    await prepareInitialisePermissionCallData(
      {
        portalAddress: args.portalAddress,
        fileId: args.fileId,
        currentPermissionType: args.currentPermissionType,
        permissionMap: args.permissionMap,
        fileKey: args.fileKey,
        commentKey: args.commentKey,
        voprfManager: args.voprfManager,
        secretKey: args.secretKey,
        encryptionCallback: args.encryptionCallback,
      },
      uploadFn
    );

  return {
    callData: encodedCallData,
    permissionHash: permissionIPFSHash,
  };
};

export const getOwnerPermissionSet = async (
  fileId: number,
  permissionAddress: Hex,
  publicClient: PublicClient,
  decryptionCallback: (data: string) => Uint8Array,
  fetchFn: (hash: string) => Promise<unknown>
) => {
  const [onChainPermissionHash] = await getCurrentFilePermission(
    fileId,
    permissionAddress,
    publicClient
  );

  const permissionContent = (await fetchFn(
    onChainPermissionHash
  )) as PermissionContent;

  const ownerPermissionSetBytes = decryptionCallback(
    permissionContent.ownerPermissionSet
  );

  const ownerPermissionSet = JSON.parse(
    new TextDecoder().decode(ownerPermissionSetBytes)
  ) as Record<string, PermissionMapItem>;

  return {
    permissionMap: ownerPermissionSet,
  };
};
