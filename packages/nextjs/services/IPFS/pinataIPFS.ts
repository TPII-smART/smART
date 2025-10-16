// IPFS/pinataIPFS.ts
import axios from "axios";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";
const PINATA_API = "https://api.pinata.cloud/pinning/pinFileToIPFS";

// Upload file to Pinata (IPFS)
export const uploadToIPFS = async (file: File): Promise<string | undefined> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(PINATA_API, formData, {
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
    });

    const ipfsHash = res.data.IpfsHash; // CID returned by Pinata
    console.log("Uploaded to IPFS:", ipfsHash);
    return `ipfs://${ipfsHash}`;
  } catch (error) {
    console.error("Failed to upload file to IPFS:", error);
    return undefined;
  }
};

// Resolve ipfs://... to full HTTP gateway URL
export const resolveIPFSHash = (uri: string): string => {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return `${PINATA_GATEWAY}/${cid}`;
  }
  return uri;
};
