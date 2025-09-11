"use client";

import { useState } from "react";
import DeliverablePreview from "../DeliverablePreview/DeliverablePreview";
import FormModal from "../Modal/FormModal/FormModal";
import { FileFormData, UploadTab, tabs } from "../UploadFileForm/types";
import Separator from "../ui/Separator";
import * as Yup from "yup";
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Button from "~~/components/Button/Button";
import FileUploadBox from "~~/components/FileUploadBox";
import Tabs from "~~/components/Tabs/Tabs";
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
  onApprove?: (data: FileFormData, comment: string) => void;
  onReject?: (comment: string) => void;
  comment: string;
  resource: string;
  isLink: boolean;
  canUploadFile?: boolean;
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
    comment,
    resource,
    isLink,
    canUploadFile,
  } = props;
  const [submitAction, setSubmitAction] = useState("");
  const [selectedTab, setSelectedTab] = useState<UploadTab>("file");

  const resolveResource = (res: string, link: boolean) => {
    if (link) return res;
    return resolveIPFSHash(res);
  };

  const handleSubmit = async (values: { reviewComment: string; fileValues: FileFormData }) => {
    try {
      if (submitAction === "approve" && onApprove) {
        await onApprove(values.fileValues, values.reviewComment);
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
          console.log("File values:", values.fileValues);
          await handleSubmit(values);
          resetForm();
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

          <div>
            <h3 className="flex font-medium gap-2 mb-4 text-primary-content items-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              {canUploadFile ? "Client response" : "Freelancer comment"}
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

          {canUploadFile && (
            <div className="space-y-10">
              <Separator />
              <h3 className="flex font-medium gap-2 mb-4 text-primary-content items-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                {"Upload new Deliverable"}
              </h3>
              {/* File Upload */}
              <div className="flex gap-2 mb-2">
                <Tabs
                  tabs={tabs}
                  onChange={id => {
                    setSelectedTab(id.toString() as UploadTab);
                    formik.setFieldValue("fileValues.isLink", id.toString() === "link");
                  }}
                />
              </div>
              {selectedTab === "file" ? (
                <FileUploadBox
                  onUploadSuccess={(val: File) => formik.setFieldValue("fileValues.file", val)}
                  acceptedFileType={"Image"}
                  //onUploadError={Render error message}
                  //onUploadError={error => formik.setFieldValue("file", undefined)}
                />
              ) : (
                <InputBase
                  placeholder="Paste your link here"
                  variant="filled"
                  value={formik.values.fileValues.link || ""}
                  onChange={(val: string) => formik.setFieldValue("fileValues.link", val)}
                  error={formik.touched.fileValues?.link && !!formik.errors.fileValues?.link}
                  helperText={
                    formik.touched.fileValues?.link && formik.errors.fileValues?.link
                      ? formik.errors.fileValues.link
                      : ""
                  }
                />
              )}
            </div>
          )}
          <Separator />
          {/* Your Response */}
          <div>
            <h3 className="flex font-medium gap-2 text-primary-content items-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Your Response
            </h3>
            <InputBase
              placeholder="Add your feedback or comment"
              multiline
              minRows={4}
              maxRows={4}
              value={canUploadFile ? formik.values.fileValues.submissionComment : formik.values.reviewComment}
              onChange={(val: string) =>
                canUploadFile
                  ? formik.setFieldValue("fileValues.submissionComment", val)
                  : formik.setFieldValue("reviewComment", val)
              }
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
              {canUploadFile ? (
                <Button
                  type="submit"
                  className="btn btn-primary"
                  variant="primary"
                  onClick={() => setSubmitAction("approve")}
                >
                  <PaperAirplaneIcon className="w-4 h-4 inline-block mr-1" />
                  Submit Deliverable
                </Button>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default DeliverableReviewModal;
