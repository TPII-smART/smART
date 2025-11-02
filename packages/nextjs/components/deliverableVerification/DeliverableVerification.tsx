import { memo, useState } from "react";
import Button from "../Button";
import Modal from "../Modal/Modal";
import Skeleton from "../Skeleton/Skeleton";
import { DeliverableVerificationProps, VerificationChipProps } from "./types";
import { Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { analyzeDeliverable } from "~~/services/graphql/fetchers/backend.service";
import { AnalysisBadge } from "~~/types/deliverable";

const colors = {
  [AnalysisBadge.MATCHS_WITH_DESCRIPTION]: {
    background: "#4caf50",
    text: "#ffffff",
  },
  [AnalysisBadge.NEEDS_REVISION]: {
    background: "#f44336",
    text: "#ffffff",
  },
  [AnalysisBadge.UNKNOWN]: {
    background: "#6e6e6e",
    text: "#ffffff",
  },
};

const VerificationChip = ({ badge, details }: VerificationChipProps) => {
  return (
    <Chip
      label={badge}
      title={details}
      sx={{
        backgroundColor: colors[badge].background,
        color: colors[badge].text,
      }}
    />
  );
};

const DeliverableVerification_ = ({
  deliverables,
  workId,
  workTitle,
  workDescription,
}: DeliverableVerificationProps) => {
  const {
    data: analysis = { badge: AnalysisBadge.UNKNOWN, details: "There is no deliverables to analyze." },
    isLoading,
  } = useQuery({
    queryKey: ["deliverableAnalysis", workId],
    queryFn: async () => {
      return analyzeDeliverable(
        workId + "-" + deliverables.length,
        deliverables,
        `TL;DR\n${workTitle} \n\n${workDescription}`,
      );
    },
    enabled: deliverables.length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const [modalOpen, setModalOpen] = useState(false);

  if (deliverables.length === 0) {
    return null;
  }

  return (
    <>
      <Skeleton variant="rounded" active={isLoading}>
        <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
          AI Analysis
        </Button>
      </Skeleton>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Deliverable AI Verification">
        <div className="flex flex-col gap-4">
          <VerificationChip badge={analysis.badge} details={analysis.details} />
          <div className="p-4 bg-[var(--color-surface-variant)] border border-[var(--color-border)] rounded-lg">
            <h3 className="text-lg font-medium mb-2">Analysis Details</h3>
            <p className="whitespace-pre-wrap">{analysis.details}</p>
          </div>
        </div>
      </Modal>
    </>
  );
};

const DeliverableVerification = memo(DeliverableVerification_);
DeliverableVerification.displayName = "DeliverableVerification";

export default DeliverableVerification;
