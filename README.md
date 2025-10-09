# @fileverse/granular-permissions

A TypeScript library for cryptographically secure, blockchain-based permission management for files. Combines smart contracts, Merkle trees, VOPRF (Verifiable Oblivious Pseudorandom Function), and multi-layer encryption to provide privacy-preserving access control.

## Features

- **Privacy-Preserving Permissions** - VOPRF protocol ensures servers cannot learn user identities
- **Granular Access Control** - Six permission types from public view to private edit
- **Multi-Identity Support** - Grant permissions via email, wallet address, or ENS
- **Blockchain-Based** - Immutable permission records on Ethereum-compatible chains
- **Merkle Tree Proofs** - Efficient membership verification without revealing full permission lists
- **Multi-Layer Encryption** - Separate encryption for file keys, agent keys, and comment keys

## Installation

```bash
npm install @fileverse/granular-permissions
```

### Peer Dependencies

```bash
npm install viem
```

## Permission Types

The system supports six permission levels:

- **PublicView** - Anyone can view the file
- **PublicComment** - Anyone can comment on the file
- **PublicEdit** - Anyone can edit the file
- **PrivateView** - Restricted viewing with encrypted access
- **PrivateComment** - Restricted commenting with encrypted access
- **PrivateEdit** - Restricted editing with encrypted access

## Usage

### Initialize the Permission Manager

```typescript
import {
  GranularPermissions,
  VOPRFManager,
} from "@fileverse/granular-permissions";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const voprfManager = new VOPRFManager(suiteId, publicKey, evaluationUrl);

const uploadToIPFS = async (data: unknown) => {
  // Your IPFS upload logic
  return "QmHash...";
};

const fetchFromIPFS = async (hash: string) => {
  // Your IPFS fetch logic
  return data;
};

const gp = new GranularPermissions(
  publicClient,
  uploadToIPFS,
  fetchFromIPFS,
  voprfManager,
  contractAddress
);
```

### Set File Permissions

```typescript
import { PermissionType } from "@fileverse/granular-permissions";

const permissionMap = {
  "user@example.com": {
    type: "email",
    value: "user@example.com",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    agentKey: "0x...",
    agentAddress: "0x...",
  },
  "0x1234...": {
    type: "wallet",
    value: "0x1234...",
    address: "0x1234...",
    agentKey: "0x...",
    agentAddress: "0x...",
  },
};

const { contractAddress, callData, permissionHash } =
  await gp.preparePermissionContractCallData({
    portalAddress: "0x...",
    fileId: 123,
    currentPermissionType: PermissionType.PrivateView,
    permissionMap,
    fileKey: "base64EncodedFileKey",
    commentKey: "base64EncodedCommentKey",
    secretKey: "base64EncodedfileSpecificKeyToEncryptTheMerkleTree",
    encryptionCallback: (data) => encrypt(data),
  });
```

### Retrieve Permissions

```typescript
const permissionContent = await gp.getPermissionContent(fileId);

const { permissionMap } = await gp.getOwnerPermissionSet(
  fileId,
  (encryptedData) => decrypt(encryptedData)
);
```

## Architecture

### Security Model

1. **VOPRF Protocol** - User identifiers are blinded before server evaluation, preventing identity leakage
2. **Merkle Tree** - Efficiently proves membership without revealing all members
3. **Deterministic Key Derivation** - Same proof always generates the same encryption key
4. **Multi-Layer Encryption**:
   - Merkle tree encrypted with file specific secret key
   - Permission map encrypted via user-provided callback
   - Individual keys encrypted with VOPRF-derived AES keys

### Permission Flow

#### Granting Access

1. Create permission map with user identifiers and agent keys
2. Generate Merkle tree from hashed identifiers
3. For each user:
   - Generate Merkle proof
   - Process through VOPRF to derive encryption key
   - Encrypt file key, agent key, and comment key
4. Upload encrypted permission data to IPFS
5. Store IPFS hash on smart contract

#### Verifying Access

1. Fetch permission data from IPFS (hash from contract)
2. Generate Merkle proof for requesting user
3. Process proof through VOPRF to derive same encryption key
4. Decrypt and retrieve file key, agent key
5. Access file content with decrypted keys

### Smart Contract Integration

The library interfaces with a FileversePermission smart contract providing:

- `initializeFilePermission` - Set initial file permissions
- `updateFilePermission` - Modify existing permissions
- `getFilePermission` - Retrieve permission metadata
- `hasFilePermission` - Check user access rights

## API Reference

### GranularPermissions

#### Constructor

```typescript
new GranularPermissions(
  publicClient: PublicClient,
  uploadFn: (data: unknown) => Promise<string>,
  fetchFn: (hash: string) => Promise<unknown>,
  voprfManager: VOPRFManager,
  contractAddress: Hex
)
```

#### Methods

##### `getPermissionAddress()`

Returns the contract address.

##### `getOwnerPermissionSet(fileId, decryptionCallback)`

Retrieves the owner's permission map for a file.

**Parameters:**

- `fileId: number` - The file identifier
- `decryptionCallback: (data: string) => Uint8Array` - Decryption function

**Returns:** `Promise<{ permissionMap: Record<string, PermissionMapItem> }>`

##### `preparePermissionContractCallData(args)`

Prepares contract call data for setting permissions.

**Parameters:**

- `args: PermissionContractCallArgs` - Permission configuration

**Returns:** `Promise<{ contractAddress, callData, permissionHash }>`

##### `getPermissionContent(fileId)`

Fetches permission content from IPFS.

**Parameters:**

- `fileId: number` - The file identifier

**Returns:** `Promise<PublicPermissionContent>`

### VOPRFManager

#### Constructor

```typescript
new VOPRFManager(
  suite: SuiteID,
  publicKey: string,
  evaluationUrl: string
)
```

#### Methods

##### `processInput(inputBytes)`

Processes input through VOPRF protocol.

**Parameters:**

- `inputBytes: Uint8Array` - Input to process

**Returns:** `Promise<Uint8Array>` - VOPRF output for key derivation

## Types

### PermissionMapItem

```typescript
interface PermissionMapItem {
  type: "email" | "wallet" | "ens";
  value: string;
  address: Hex;
  isOwner?: boolean;
  agentKey: Hex;
  agentAddress: Hex;
}
```

### EncryptionKeyEntry

```typescript
interface EncryptionKeyEntry {
  encryptedFileKey: string;
  salt: string;
  encryptedAgentKey: string;
  encryptedCommentKey?: string;
}
```

## Dependencies

- **viem** - Ethereum interaction
- **@cloudflare/voprf-ts** - VOPRF protocol implementation
- **@openzeppelin/merkle-tree** - Merkle tree utilities
- **@fileverse/crypto** - Encryption primitives
- **is-ipfs** - IPFS CID validation
- **js-base64** - Base64 encoding

## Development

### Build

```bash
npm run build
```

### Production Build

```bash
npm run build:prod
```

### Development Mode

```bash
npm run dev
```

## Acknowledgments

This work is inspired from VOPRF work on zkemail + semaphore protocol.

## License

GNU GPL
