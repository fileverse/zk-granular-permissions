import { Hex } from "viem";
import { VOPRFManager } from "../voprf";

export interface PermissionMapItem {
  type: "email" | "wallet" | "ens";
  value: string;
  address: Hex;
  isOwner?: boolean;
  agentKey: Hex;
  agentAddress: Hex;
}

export enum PermissionType {
  PublicView = "PublicView",
  PublicComment = "PublicComment",
  PublicEdit = "PublicEdit",
  PrivateView = "PrivateView",
  PrivateComment = "PrivateComment",
  PrivateEdit = "PrivateEdit",
}

export interface EncryptionKeyEntry {
  encryptedFileKey: string;
  salt: string;
  encryptedAgentKey: string;
  encryptedCommentKey?: string; // only present for private comment permission
}

export interface EncryptionKeyTree {
  [key: string]: EncryptionKeyEntry;
}

export enum PermissionRegistryType {
  PRIVATE,
  DECETRALISED,
}

export enum FileRole {
  VIEW,
  COMMENT,
  EDIT,
}

export interface PermissionContractCallArgs {
  portalAddress: Hex;
  fileId: number;
  currentPermissionType: PermissionType;
  permissionMap: Record<string, PermissionMapItem>;
  fileKey: string;
  commentKey: string;
  voprfManager: VOPRFManager;
  secretKey: Uint8Array;
  encryptionCallback: (data: Uint8Array) => string;
}

export interface InitialisePermissionCallArgs {
  fileId: number;
  metadataHash: string;
  registryType: PermissionRegistryType;
  smartAccountAddresses: Hex[];
  currentPermissionType: PermissionType;
}

export interface PermissionContent {
  permissionTree: string;
  ownerPermissionSet: string;
  encryptionKeyTree: EncryptionKeyTree;
}

export interface PublicPermissionContent
  extends Omit<PermissionContent, "ownerPermissionSet"> {}
