"use client";

import BaseModal from "../../Modal/Modal";
import DeliverablePreview from "@/components/DeliverablePreview/DeliverablePreview";
import Separator from "@/components/ui/Separator";
import { ChatBubbleLeftRightIcon, PaperClipIcon } from "@heroicons/react/24/outline";

interface PreviewModalProps {
  loading?: boolean;
  modalTitle?: string;
  modalDescription?: string;
  isOpen: boolean;
  onClose: () => void;
  resource: string;
  comment?: string;
  isClient?: boolean;
}

const PreviewModal = (props: PreviewModalProps) => {
  const { loading, modalTitle, modalDescription, isOpen, onClose, resource, comment, isClient } = props;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        description={modalDescription}
        loading={loading}
        width={600}
      >
        <div className="space-y-4 px-1 pb-2">
          {/* Deliverable Preview */}
          <div>
            <h3 className="flex gap-2 font-medium items-center mb-4 text-primary-content">
              <PaperClipIcon className="w-4 h-4" />
              Deliverable
            </h3>
            <div
              className="smrt-inner-border rounded-md p-4 flex justify-center"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-inside-border)",
              }}
            >
              <DeliverablePreview resource={resource} />
            </div>
          </div>
          <Separator />

          <div>
            <h3 className="flex font-medium gap-2 mb-4 text-primary-content items-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              {isClient ? "Freelancer comment" : "Client response"}
            </h3>
            {/* Comment */}
            {comment ? (
              <div>
                <div
                  className="smrt-inner-border rounded-md p-4"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-inside-border)",
                  }}
                >
                  <span
                    className="text-sm text-pretty whitespace-pre-line break-words"
                    style={{ color: "var(--color-primary-content)" }}
                  >
                    {comment}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-sm " style={{ color: "var(--color-danger)" }}>
                  No comment available.
                </span>
              </div>
            )}
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default PreviewModal;
