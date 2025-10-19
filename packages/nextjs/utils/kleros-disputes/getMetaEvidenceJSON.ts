import { uploadToIPFS } from "@services/IPFS/pinataIPFS";

const createTalentMetaEvidenceJSON = (reason: string) => {
  return JSON.stringify({
    category: "Freelance",
    title: "Freelance work dispute",
    description: `A dispute has arisen between a freelancer and a client. The arbitrator must decide who is in the right and allocate the funds held in escrow accordingly. The reason given for the dispute arisal was the following: ${reason}`,
    question: "Which of the parties involved in the Job should be considered as the winner of the argument?",
    rulingOptions: {
      type: "single-select",
      titles: ["Freelancer wins", "Client wins"],
      descriptions: [
        "The freelancer fulfilled their contractual obligations and should be paid.",
        "The client is in the right, the freelancer should not be paid due to non-fulfillment of contractual obligations.",
      ],
    },
    fileURI: "/ipfs/bafkreib7j3vvwfz4kz6z7trcj25fi4na7ok4u2vmg63zul76yfgl4vnj7a",
  });
};

export const getTalentMetaEvidence = async (reason: string) => {
  // Upload meta-evidence to IPFS
  const file = new File([createTalentMetaEvidenceJSON(reason)], "metaEvidence.json", { type: "application/json" });
  return uploadToIPFS(file).then(ipfsURI => {
    return ipfsURI ? ipfsURI.replace("ipfs://", "ipfs://ipfs/") : "";
  });
};
