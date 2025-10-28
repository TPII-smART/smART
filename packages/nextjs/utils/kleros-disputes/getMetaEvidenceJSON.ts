import { uploadToIPFS } from "@services/IPFS/pinataIPFS";

const createMetaEvidenceJSON = () => {
  return JSON.stringify({
    category: "Freelance",
    title: "Freelance work dispute",
    description:
      "A dispute has arisen between a freelancer and a client. The arbitrator must decide who is in the right and allocate the funds held in escrow accordingly.",
    question: "Which of the parties involved in the Job should be considered as the winner of the argument?",
    rulingOptions: {
      type: "single-select",
      titles: ["Freelancer wins", "Client wins"],
      descriptions: [
        "The freelancer fulfilled their contractual obligations and should be paid.",
        "The client is in the right, the freelancer should not be paid due to non-fulfillment of contractual obligations.",
      ],
    },
    fileURI: "/ipfs/Qmf8fCJNXLW4evBv73DUgAV2WJeBotsrfcoG285E7bRVTg",
  });
};

export const createMetaEvidence = async () => {
  // Upload meta-evidence to IPFS
  const file = new File([createMetaEvidenceJSON()], "metaEvidence.json", { type: "application/json" });
  return uploadToIPFS(file).then(ipfsURI => {
    return ipfsURI ? ipfsURI.replace("ipfs://", "ipfs://ipfs/") : "";
  });
};

export const getMetaEvidenceURI = () => {
  // Get the default meta-evidence IPFS hash, hardcoded for simplicity
  // Uses the Kleros format for rendering from IPFS: ipfs://ipfs/<CID>
  return "ipfs://ipfs/Qma1bxaVdteZYzBU7vMAbpeMqT1xMihjhESUw8Unf6REjb";
};
