import { FileFormData } from "../UploadFileForm/types";
import { DetailData } from "~~/types/detail/detail.type";

export interface UniversalDetailProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: DetailData;
  deliverables?: any[];
  statusBadge?: React.ReactNode;
  actionButtons: React.ReactNode[];
  statusMessage: React.ReactNode;
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
  handleConfirmCompletion: (fileData?: FileFormData, clientResponse?: string) => Promise<void>;
  handleRejectJob: (reason: string) => void;
  handleRateJob: (rating: number) => void;
  initiateConflictResolution: () => void;
}
