import { FileFormData } from "../UploadFileForm/types";
import { DetailData } from "~~/types/detail/detail.type";

export interface UniversalDetailProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: DetailData;
  deliverables?: any[];
  statusBadge?: React.ReactNode;
  actionButtons: React.ReactNode[];
  statusMessage: string;
  loading?: boolean;
  isMining: boolean;
  isDeliverableLoading: boolean;
  error?: any;
  reload?: () => void;
  isUploadModalOpen: boolean;
  onCloseUploadModal: () => void;
  isDeliverableModalOpen: boolean;
  onCloseDeliverableModal: () => void;
  isRatingModalOpen: boolean;
  onCloseRatingModal: () => void;
  isPreviewModalOpen: boolean;
  onClosePreviewModal: () => void;
  handleClientConfirmCompletion: (clientResponse: string) => Promise<void>;
  handleRejectJob: (reason: string) => void;
  handleRateJob: (rating: number) => void;
  handleFreelancerConfirmCompletion: (deliverableData: FileFormData) => Promise<void>;
}
