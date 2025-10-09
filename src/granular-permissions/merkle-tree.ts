import { SimpleMerkleTree } from "@openzeppelin/merkle-tree";
import { SimpleMerkleTreeData } from "@openzeppelin/merkle-tree/dist/simple";
import { Hex, hexToBytes, keccak256, stringToBytes } from "viem";

export const generateMerkleTree = async (identifiers: string[]) => {
  if (identifiers.length === 0) throw new Error("No identifiers found");

  const merkleTree = SimpleMerkleTree.of(
    identifiers.map((identifier) => keccak256(stringToBytes(identifier)))
  );

  return merkleTree;
};

export const getProofBytes = (
  merkleTree: SimpleMerkleTree,
  identifier: string
) => {
  if (merkleTree.length === 1) return hexToBytes(merkleTree.root as Hex);

  const proof = merkleTree.getProof(keccak256(stringToBytes(identifier)));

  let completeProofBytes = new Uint8Array();
  proof.forEach((proofPart) => {
    const proofPartBytes = hexToBytes(proofPart as Hex);
    const newArray = new Uint8Array(
      completeProofBytes.length + proofPartBytes.length
    );
    newArray.set(completeProofBytes);
    newArray.set(proofPartBytes, completeProofBytes.length);
    completeProofBytes = newArray;
  });

  return completeProofBytes;
};

export const dumpToMerkleTree = (dump: SimpleMerkleTreeData) => {
  const merkleTree = SimpleMerkleTree.load(dump);
  return merkleTree;
};

export const verifyMerkleProof = (
  merkleTree: SimpleMerkleTree,
  identifier: string
) => {
  const leaf = keccak256(stringToBytes(identifier));
  const proof = merkleTree.getProof(leaf);
  const isVerified = SimpleMerkleTree.verify(merkleTree.root, leaf, proof);
  return isVerified;
};
