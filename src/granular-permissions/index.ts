import { Hex, PublicClient } from "viem";
import { VOPRFManager } from "../voprf";
import {
  loadPermissionContent,
  preparePermissionUpdateExecRequest,
  getOwnerPermissionSet,
} from "./utils";
import { PermissionContractCallArgs } from "./types";

export class GranularPermissions {
  private publicClient: PublicClient;
  private uploadFn: (data: unknown) => Promise<string>;
  private fetchFn: (hash: string) => Promise<unknown>;
  private voprfManager: VOPRFManager;
  private contractAddress: Hex;

  constructor(
    publicClient: PublicClient,
    uploadFn: (data: unknown) => Promise<string>,
    fetchFn: (hash: string) => Promise<unknown>,
    voprfManager: VOPRFManager,
    contractAddress: Hex
  ) {
    this.publicClient = publicClient;
    this.uploadFn = uploadFn;
    this.fetchFn = fetchFn;
    this.voprfManager = voprfManager;
    this.contractAddress = contractAddress;
  }

  getPermissionAddress() {
    return this.contractAddress;
  }

  /**
   * Get the owner permission set for a given file id
   * @param fileId - The file id
   * @param decryptionCallback - The decryption callback
   * @returns The owner permission set
   */
  async getOwnerPermissionSet(
    fileId: number,
    decryptionCallback: (data: string) => Uint8Array
  ) {
    return getOwnerPermissionSet(
      fileId,
      this.contractAddress,
      this.publicClient,
      decryptionCallback,
      this.fetchFn
    );
  }

  /**
   * Prepare the permission contract call data
   * @param args - The permission contract call args
   * @returns The permission contract call data
   */
  async preparePermissionContractCallData(
    args: Omit<PermissionContractCallArgs, "voprfManager">
  ) {
    const { callData, permissionHash } =
      await preparePermissionUpdateExecRequest(
        { ...args, voprfManager: this.voprfManager },
        this.uploadFn
      );

    return {
      contractAddress: this.contractAddress,
      callData,
      permissionHash,
    };
  }

  /**
   * Get the permission content for a given file id
   * @param fileId - The file id
   * @returns The permission content
   */
  async getPermissionContent(fileId: number) {
    return loadPermissionContent(
      this.contractAddress,
      fileId,
      this.publicClient,
      this.fetchFn
    );
  }
}
