"use client";

import { useState } from "react";
import DeliverablePreview from "../DeliverablePreview/DeliverablePreview";
import FormModal from "../Modal/FormModal/FormModal";
import { FileFormData } from "../UploadFileForm/types";
import Separator from "../ui/Separator";
import * as Yup from "yup";
import { ChatBubbleLeftRightIcon, CheckCircleIcon, PaperClipIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Button from "~~/components/Button/Button";
import { InputBase } from "~~/components/scaffold-eth/Input/InputBase";

const validationSchema = Yup.object().shape({
  reviewComment: Yup.string().max(512, "Comment must be at most 512 characters").required("Comment is required"),
});

interface DeliverableReviewModalProps {
  loading?: boolean;
  modalTitle?: string;
  modalDescription?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onApprove?: (data: string) => void;
  onReject?: (comment: string) => void;
  comment: string;
  resource: string;
  showFullInfo?: boolean;
}

const DeliverableReviewModal = (props: DeliverableReviewModalProps) => {
  const {
    onApprove,
    onReject,
    loading,
    modalTitle = "Preview of the last deliverable",
    modalDescription = "Please review the deliverable and provide your feedback.",
    isOpen = false,
    onClose,
    comment,
    resource,
    showFullInfo,
  } = props;
  const [submitAction, setSubmitAction] = useState("");

  const handleSubmit = async (values: { reviewComment: string; fileValues: FileFormData }) => {
    try {
      if (submitAction === "approve" && onApprove) {
        await onApprove(values.reviewComment);
      } else if (submitAction === "reject" && onReject) {
        await onReject(values.reviewComment);
      }
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      onClose?.();
    }
  };
  return (
    <FormModal
      modalProps={{
        title: modalTitle,
        description: modalDescription,
        isOpen: !!isOpen,
        onClose,
        loading,
        hideDefaultButtons: true,
        width: 500,
      }}
      formikProps={{
        initialValues: { reviewComment: "", fileValues: new FileFormData() },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
          await handleSubmit(values);
          resetForm();
        },
        enableReinitialize: true,
      }}
    >
      {formik => (
        <div className="space-y-4 px-1 pb-2">
          {showFullInfo && (
            <>
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
                  Client response
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
            </>
          )}
          <div>
            <h3 className="flex font-medium gap-2 mb-4 text-primary-content items-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Add your comment
            </h3>
            <div
              className="smrt-inner-border rounded-md p-4"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-inside-border)" }}
            >
              <InputBase
                placeholder="Add your feedback or comment"
                multiline
                minRows={4}
                maxRows={4}
                value={formik.values.reviewComment}
                onChange={(e: any) => {
                  const val = typeof e === "string" ? e : (e?.target as HTMLInputElement | HTMLTextAreaElement)?.value;
                  void formik.setFieldValue("reviewComment", val);
                }}
                error={formik.touched.reviewComment && !!formik.errors.reviewComment}
                helperText={
                  formik.touched.reviewComment && formik.errors.reviewComment ? formik.errors.reviewComment : ""
                }
              />
            </div>
          </div>

          <Separator />
          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
              style={{ minWidth: 80 }}
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                className="btn btn-danger"
                variant="danger"
                onClick={() => setSubmitAction("reject")}
                disabled={loading}
                style={{ minWidth: 90 }}
                size="sm"
              >
                <XCircleIcon className="w-4 h-4 inline-block mr-1" />
                Reject
              </Button>
              <Button
                type="submit"
                className="btn btn-primary"
                variant="primary"
                onClick={() => setSubmitAction("approve")}
                disabled={loading}
                style={{ minWidth: 90 }}
                size="sm"
              >
                <CheckCircleIcon className="w-4 h-4 inline-block mr-1" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default DeliverableReviewModal;
