"use client";

import { useState } from "react";
import { FileFormData } from "./types";
import * as Yup from "yup";
import FileUploadBox from "~~/components/FileUploadBox";
import FormModal from "~~/components/Modal/FormModal/FormModal";
import { InputBase } from "~~/components/scaffold-eth/Input/InputBase";

interface UploadDeliverableFormProps {
  onSubmit: (deliverableData: FileFormData) => Promise<void>;
  loading?: boolean;
  modalTitle?: string;
  modalDescription?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const UploadDeliverableForm = ({
  onSubmit,
  loading,
  modalTitle = "Upload Deliverable",
  modalDescription = "Please upload the required file, and add a comment for the client.",
  isOpen,
  onClose,
}: UploadDeliverableFormProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const modalOpen = typeof isOpen === "boolean" ? isOpen : internalOpen;
  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

  const validationSchema = Yup.object().shape({
    submissionComment: Yup.string().max(512, "Comment must be at most 512 characters"),
    file: Yup.mixed().required("File is required"),
  });

  return (
    <>
      <FormModal
        modalProps={{
          title: modalTitle,
          onClose: handleClose,
          isOpen: modalOpen,
          loading,
          description: modalDescription,
          width: 550,
        }}
        formikProps={{
          onSubmit: async (values: FileFormData) => {
            await onSubmit(values);
            handleClose();
          },
          initialValues: new FileFormData(),
          validationSchema,
          enableReinitialize: true,
        }}
      >
        {({ values, setFieldValue, touched, errors }) => (
          <div className="space-y-4">
            <div className="flex gap-2 mb-2"></div>
            <FileUploadBox onUploadSuccess={(val: File) => setFieldValue("file", val)} acceptedFileType={"Image"} />

            <InputBase
              placeholder="Comment"
              multiline
              minRows={4}
              maxRows={4}
              variant="filled"
              value={values.submissionComment}
              onChange={(val: string) => setFieldValue("submissionComment", val)}
              error={touched.submissionComment && !!errors.submissionComment}
              helperText={touched.submissionComment && errors.submissionComment ? errors.submissionComment : ""}
            />
          </div>
        )}
      </FormModal>
    </>
  );
};

export default UploadDeliverableForm;
