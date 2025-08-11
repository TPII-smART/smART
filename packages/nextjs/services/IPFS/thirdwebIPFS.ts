// Library for handling file uploads and storage in the IPFS
import { ThirdwebStorage } from "@thirdweb-dev/storage";

// Instantiate the storage SDK
const storage = new ThirdwebStorage({ clientId: process.env.NEXT_PUBLIC_THIRD_WEB_STORAGE_CLIENT_ID });

// Uploads the file to the IPFS service, which returns a Hash
export const uploadToIPFS = async (file: File | undefined): Promise<string | undefined> => {
  try {
    const ipfsHash = await storage.upload(file);
    console.log("Uploaded to IPFS:", ipfsHash);
    return ipfsHash;
  } catch (error) {
    console.error("Failed to upload file to IPFS:", error);
    return undefined;
  }
};

// Resolves the IPFS hash to a full renderable URI
export const resolveIPFSHash = (hash: string): string => {
  try {
    const resolvedUri = storage.resolveScheme(hash);
    console.log("Resolved IPFS URI:", resolvedUri);
    return resolvedUri;
  } catch (error) {
    console.error("Failed to resolve IPFS hash:", error);
    return "";
  }
};
