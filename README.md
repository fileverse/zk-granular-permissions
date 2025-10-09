# @fileverse/zk-granular-permissions

A TypeScript library for cryptographically secure, blockchain-based permission management for multimedia files, documents, and spreadsheets. Combines smart contracts, Merkle trees, vOPRF (Verifiable Oblivious Pseudorandom Functions), and multi-layer encryption to provide privacy-preserving access control.

Fileverse has been successfully audited by team Dédalo and Nethermind Security. All audits will be added here next week.

## Features

- **Privacy-Preserving Permissions** - VOPRF protocol ensures servers cannot learn user identities
- **Granular Access Control** - Six permission types from public view to private edit
- **Multi-Identity Support** - Grant permissions to any email address, wallet address, and/or ENS domain, a decentralized domain name system built on the Ethereum blockchain.
- **Blockchain-Based** - Immutable permission records on Ethereum Virtual Machine (EVMs) compatible blockchains, a decentralized computation engine that executes smart contracts on the Ethereum network.
- **Merkle Tree Proofs** - Efficient membership verification without revealing full permission lists
- **Multi-Layer Encryption** - Separate end-to-end encryption for file keys, agent keys, and comment keys

## Installation

```plaintext
npm install @fileverse/zk-granular-permissions
```

### Peer Dependencies

```plaintext
npm install viem
```

## Permission Types

The system supports six access permission levels:

- **PublicView** - Anyone can view the file
- **PublicComment** - Anyone can comment on the file
- **PublicEdit** - Anyone can edit the file
- **PrivateView** - Restricted viewing with encrypted access
- **PrivateComment** - Restricted commenting with encrypted access
- **PrivateEdit** - Restricted editing with encrypted access

## Usage

### Initialize the Permission Manager

```plaintext
import {
  GranularPermissions,
  VOPRFManager,
} from "@fileverse/zk-granular-permissions";
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

```plaintext
import { PermissionType } from "@fileverse/zk-granular-permissions";

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

```plaintext
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

```plaintext
new GranularPermissions(
  publicClient: PublicClient,
  uploadFn: (data: unknown) => Promise,
  fetchFn: (hash: string) => Promise,
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

**Returns:** `Promise<{ permissionMap: Record }>`

##### `preparePermissionContractCallData(args)`

Prepares contract call data for setting permissions.

**Parameters:**

- `args: PermissionContractCallArgs` - Permission configuration

**Returns:** `Promise<{ contractAddress, callData, permissionHash }>`

##### `getPermissionContent(fileId)`

Fetches permission content from IPFS.

**Parameters:**

- `fileId: number` - The file identifier

**Returns:** `Promise`

### VOPRFManager

#### Constructor

```plaintext
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

**Returns:** `Promise` - VOPRF output for key derivation

## Types

### PermissionMapItem

```plaintext
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

```plaintext
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

```plaintext
npm run build
```

### Production Build

```plaintext
npm run build:prod
```

### Development Mode

```plaintext
npm run dev
```

## Acknowledgments

This work is inspired from the great vOPRF R&D done by the Privacy Stewards of Ethereum on the [semaphore](https://github.com/semaphore-protocol) protocol and [zkemail](https://github.com/zkemail). Team Fileverse will be collaborating more actively with the [PSE](https://github.com/privacy-ethereum) team on leveraging their advanced work on TLSNotary and more <3

There is no real online collaboration without privacy. There can't be real privacy for online collaboration without zero-knowledge proofs. The Internet is the new home of our Minds. It's where we discover, produce and share information. It's where we meet and coordinate freely with others. Being unrestrained in our ability to access information and people is essential to our freedom and to global understanding and collaboration. Privacy is a cornerstone of Fileverse and all our collaboration apps and middleware. This is why we support [Privacy](https://vitalik.eth.limo/general/2025/04/14/privacy.html).

## License

GNU GPL
