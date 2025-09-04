"use client";

import { useState } from "react";
import DeliverablePreview from "../DeliverablePreview/DeliverablePreview";
import FormModal from "../Modal/FormModal/FormModal";
import Separator from "../ui/Separator";
import * as Yup from "yup";
import { ChatBubbleLeftRightIcon, CheckCircleIcon, PaperClipIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Button from "~~/components/Button/Button";
import { InputBase } from "~~/components/scaffold-eth/Input/InputBase";
import { resolveIPFSHash } from "~~/services/IPFS/thirdwebIPFS";

const validationSchema = Yup.object().shape({
  reviewComment: Yup.string().max(512, "Comment must be at most 512 characters"),
});

interface DeliverableReviewModalProps {
  loading?: boolean;
  modalTitle?: string;
  modalDescription?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onApprove?: (comment: string) => void;
  onReject?: (comment: string) => void;
  freelancerComment: string;
  resource: string;
  isLink: boolean;
}

const DeliverableReviewModal = (props: DeliverableReviewModalProps) => {
  const {
    onApprove,
    onReject,
    loading,
    modalTitle = "Preview of deliverable",
    modalDescription = "Please review the deliverable and provide your feedback.",
    isOpen = false,
    onClose,
    freelancerComment,
    resource,
    isLink,
  } = props;
  const [submitAction, setSubmitAction] = useState("");

  const resolveResource = (res: string, link: boolean) => {
    if (link) return res;
    return resolveIPFSHash(res);
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
      }}
      translations={{
        cancelLabel: "Cancel",
        submitLabel: submitAction === "approve" ? "Approve" : submitAction === "reject" ? "Reject" : "Submit",
      }}
      formikProps={{
        initialValues: { reviewComment: "" },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
          try {
            if (submitAction === "approve" && onApprove) {
              await onApprove(values.reviewComment);
            } else if (submitAction === "reject" && onReject) {
              await onReject(values.reviewComment);
            }
          } catch (error) {
            console.error("Submission failed:", error);
          } finally {
            resetForm();
            onClose?.();
          }
        },
        enableReinitialize: true,
      }}
    >
      {formik => (
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
              <DeliverablePreview resource={resolveResource(resource, isLink)} isLink={isLink} />
            </div>
          </div>
          <Separator />
          {/* Freelancer Comment */}
          {freelancerComment && (
            <div>
              <h3 className="flex font-medium gap-2 mb-4 text-primary-content items-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Freelancer comment
              </h3>
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
                  {freelancerComment}
                </span>
              </div>
            </div>
          )}
          <Separator />
          {/* Your Response */}
          <div>
            <h3 className="flex font-medium gap-2 mb-4 text-primary-content items-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Your Response
            </h3>
            <InputBase
              placeholder="Add your feedback or comment"
              multiline
              minRows={4}
              maxRows={4}
              value={formik.values.reviewComment}
              onChange={(val: string) => formik.setFieldValue("reviewComment", val)}
              error={formik.touched.reviewComment && !!formik.errors.reviewComment}
              helperText={
                formik.touched.reviewComment && formik.errors.reviewComment ? formik.errors.reviewComment : ""
              }
            />
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
              >
                <XCircleIcon className="w-6 h-6 inline-block mr-1" />
              </Button>
              <Button
                type="submit"
                className="btn btn-primary"
                variant="primary"
                onClick={() => setSubmitAction("approve")}
                disabled={loading}
                style={{ minWidth: 90 }}
              >
                <CheckCircleIcon className="w-6 h-6 inline-block mr-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default DeliverableReviewModal;
