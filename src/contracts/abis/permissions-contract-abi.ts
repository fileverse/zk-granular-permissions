import { Abi } from "viem";

export const PERMISSIONS_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_trustedForwarder",
        type: "address",
      },
      {
        internalType: "address",
        name: "_app",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "fileId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "filePermissionMetadata",
        type: "string",
      },
      {
        indexed: false,
        internalType: "enum FileversePermission.PermissionRegistryType",
        name: "filePermissionRegistryType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "address",
        name: "filePermissionExtenderAddress",
        type: "address",
      },
    ],
    name: "FilePermissionInitialised",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "fileId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "filePermissionMetadata",
        type: "string",
      },
    ],
    name: "FilePermissionUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fileId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_contentHash",
        type: "string",
      },
    ],
    name: "editFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "filePermissionExtender",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "filePermissionMetadata",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "filePermissionRegistryType",
    outputs: [
      {
        internalType: "enum FileversePermission.PermissionRegistryType",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fileId",
        type: "uint256",
      },
    ],
    name: "getFile",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "appFileId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fileType",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "metadataIPFSHash",
            type: "string",
          },
          {
            internalType: "string",
            name: "contentIPFSHash",
            type: "string",
          },
          {
            internalType: "string",
            name: "gateIPFSHash",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "version",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
        ],
        internalType: "struct IApp.File",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fileId",
        type: "uint256",
      },
    ],
    name: "getFilePermission",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "enum FileversePermission.PermissionRegistryType",
        name: "",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fileId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "enum FileversePermission.Role",
        name: "_role",
        type: "uint8",
      },
    ],
    name: "hasFilePermission",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fileId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_permissionMetadata",
        type: "string",
      },
      {
        internalType: "enum FileversePermission.PermissionRegistryType",
        name: "_permissionRegistryType",
        type: "uint8",
      },
      {
        components: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "enum FileversePermission.Role",
            name: "role",
            type: "uint8",
          },
        ],
        internalType: "struct FileversePermission.Permission[]",
        name: "_permission",
        type: "tuple[]",
      },
      {
        internalType: "bool",
        name: "_force",
        type: "bool",
      },
    ],
    name: "initializeFilePermission",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "forwarder",
        type: "address",
      },
    ],
    name: "isTrustedForwarder",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "roleList",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum FileversePermission.Role",
        name: "",
        type: "uint8",
      },
    ],
    name: "roleToName",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "trustedForwarder",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fileId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_filePermissionMetadata",
        type: "string",
      },
      {
        internalType: "address[]",
        name: "_revokes",
        type: "address[]",
      },
      {
        components: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "enum FileversePermission.Role",
            name: "role",
            type: "uint8",
          },
        ],
        internalType: "struct FileversePermission.Permission[]",
        name: "_permissions",
        type: "tuple[]",
      },
    ],
    name: "updateFilePermission",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as Abi;
