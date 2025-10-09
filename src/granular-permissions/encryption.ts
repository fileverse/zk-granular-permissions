import { SimpleMerkleTree } from "@openzeppelin/merkle-tree";

import { deriveHKDFKey } from "@fileverse/crypto/kdf";
import { generateRandomBytes } from "@fileverse/crypto/utils";
import { toAESKey } from "@fileverse/crypto/webcrypto";
import { secretBoxEncrypt } from "@fileverse/crypto/nacl";
import { fromUint8Array } from "js-base64";
import { PermissionMapItem } from "./types";

const VOPRF_ENCRYPTION_HKDF_INFO = new TextEncoder().encode(
  "VOPRF_ENCRYPTION_KEY"
);

const jsonToBytes = (json: Record<string, any>) => {
  return new TextEncoder().encode(JSON.stringify(json));
};

export const encryptMerkleTree = (
  merkleTree: SimpleMerkleTree,
  encryptionKey: Uint8Array
) => {
  const merkleTreeBytes = jsonToBytes(merkleTree.dump());

  const encryptedMerkleTree = secretBoxEncrypt(merkleTreeBytes, encryptionKey);

  return encryptedMerkleTree;
};

export const encryptPermissionMap = (
  permissionMap: Record<string, PermissionMapItem>,
  encryptionCallback: (data: Uint8Array) => string
) => {
  const permissionMapBytes = jsonToBytes(permissionMap);

  return encryptionCallback(permissionMapBytes);
};

export const aesKeyFromVOPRFOutput = async (
  voprfOutput: Uint8Array,
  existingSalt?: Uint8Array
) => {
  const salt = existingSalt ?? generateRandomBytes(12);
  const derivedKey = deriveHKDFKey(
    voprfOutput,
    salt,
    VOPRF_ENCRYPTION_HKDF_INFO
  );

  const aesKey = await toAESKey(derivedKey);

  return {
    aesKey,
    salt: fromUint8Array(salt),
  };
};
