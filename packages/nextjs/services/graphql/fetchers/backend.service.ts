import axios from "axios";
import { AnalysisBadge, DeliverableAnalysis } from "~~/types/deliverable";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const analyzeDeliverable = async (
  workId: string,
  deliverables: string[],
  expected: string,
): Promise<DeliverableAnalysis> => {
  try {
    const response = await axios.post(`${API_URL}/gemini`, {
      workId,
      hashes: [deliverables[0]],
      expected,
    });

    return response.data;
  } catch {
    return {
      badge: AnalysisBadge.UNKNOWN,
      details: "Analysis could not be completed at this time.",
    };
  }
};
