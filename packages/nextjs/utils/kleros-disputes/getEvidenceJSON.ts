import { uploadToIPFS } from "@services/IPFS/pinataIPFS";
import { keccak256, toHex } from "viem";

/**
 * Evidence JSON structure following Kleros ERC-1497 standard
 */
interface EvidenceJSON {
  fileURI: string;
  fileHash: string;
  fileTypeExtension: string;
  name: string;
  description: string;
  selfHash?: string;
}

/**
 * Extracts the file extension from the file name
 */
const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};

/**
 * Extract IPFS hash (CID) from IPFS URI
 * Handles various possible formats: ipfs://Qm..., ipfs://ipfs/Qm..., /ipfs/Qm...
 */
const extractIPFSHash = (ipfsURI: string): string => {
  return ipfsURI.replace("ipfs://", "").replace("ipfs/", "").replace("/ipfs/", "");
};

/**
 * Calculate keccak256 hash for verification of the content uploaded to IPFS
 */
const calculateKeccak256 = async (data: string): Promise<string> => {
  // Convert stringified JSON to hexString and compute keccak256 hash
  // Used for selfHash in Evidence JSON
  // Ensures that the internal content of the Evidence JSON has not been tampered with
  const hash = keccak256(toHex(data));

  // Remove '0x' prefix and return
  return hash.slice(2);
};

/**
 * Upload evidence file to IPFS and create Evidence JSON structure
 *
 * @param evidenceFile - The file to be submitted as evidence (PDF, image, document, etc.)
 * @param name - Short name/title for the evidence
 * @param description - Detailed description of what the evidence shows
 * @returns IPFS URI of the evidence JSON file (format: ipfs://ipfs/...)
 */
export const createAndUploadEvidence = async (
  evidenceFile: File,
  name: string,
  description: string,
): Promise<string> => {
  try {
    // Uploads the actual evidence file to IPFS
    const fileIpfsURI = await uploadToIPFS(evidenceFile);

    if (!fileIpfsURI) {
      throw new Error("Failed to upload evidence file to IPFS");
    }

    // Create Evidence JSON using the existing IPFS URI
    return await createEvidenceJSON(fileIpfsURI, name, description);
  } catch (error) {
    console.error("Error creating evidence:", error);
    throw error;
  }
};

/**
 * Create Evidence JSON structure from existing IPFS URI and upload to IPFS
 *
 * @param fileIpfsURI - The IPFS URI of the evidence file
 * @param name - Short name/title for the evidence
 * @param description - Detailed description of what the evidence shows
 * @returns IPFS URI of the evidence JSON file (format: ipfs://ipfs/...)
 */
export const createEvidenceJSON = async (fileIpfsURI: string, name: string, description: string): Promise<string> => {
  try {
    // Extract the IPFS hash from the URI
    const fileHash = extractIPFSHash(fileIpfsURI);

    // Get file extension
    const fileExtension = getFileExtension(name);

    // Create Evidence JSON structure
    const evidenceJSON: EvidenceJSON = {
      fileURI: fileIpfsURI.replace("ipfs://", "/ipfs/"),
      fileHash: fileHash,
      fileTypeExtension: fileExtension,
      name: name,
      description: description,
    };

    // Calculate selfHash (keccak256 of the JSON for integrity verification)
    console.log("Calculating evidence JSON hash...");
    const jsonString = JSON.stringify(evidenceJSON);
    // Add selfHash to the JSON
    evidenceJSON.selfHash = await calculateKeccak256(jsonString);

    // Upload Evidence JSON to IPFS
    console.log("Uploading evidence JSON to IPFS...");
    const evidenceJSONFile = new File([JSON.stringify(evidenceJSON, null, 2)], "evidence.json", {
      type: "application/json",
    });

    const evidenceJSONIpfsURI = await uploadToIPFS(evidenceJSONFile);

    if (!evidenceJSONIpfsURI) {
      throw new Error("Failed to upload evidence JSON to IPFS");
    }

    console.log("Evidence JSON:", evidenceJSON);
    console.log("Evidence JSON IPFS URI:", evidenceJSONIpfsURI);
    console.log("Final result: ", evidenceJSONIpfsURI.replace("ipfs://", "ipfs://ipfs/"));

    // Return the IPFS URI in the format expected by Kleros (ipfs://ipfs/...)
    return evidenceJSONIpfsURI.replace("ipfs://", "ipfs://ipfs/");
  } catch (error) {
    console.error("Error creating evidence JSON:", error);
    throw error;
  }
};
