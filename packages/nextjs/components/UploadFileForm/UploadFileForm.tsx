"use client";

import { useState } from "react";
import { FileFormData, UploadTab, tabs } from "./types";
import * as Yup from "yup";
import FileUploadBox from "~~/components/FileUploadBox";
import FormModal from "~~/components/Modal/FormModal/FormModal";
import Tabs from "~~/components/Tabs/Tabs";
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
  modalDescription = "Please upload the required file or paste a link, and optionally add a comment for the client.",
  isOpen,
  onClose,
}: UploadDeliverableFormProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const modalOpen = typeof isOpen === "boolean" ? isOpen : internalOpen;
  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };
  const [selectedTab, setSelectedTab] = useState<UploadTab>("file");

  const validationSchema = Yup.object().shape({
    submissionComment: Yup.string().max(512, "Comment must be at most 512 characters"),
    link: Yup.string().when([], {
      is: () => selectedTab === "link",
      then: schema =>
        schema.required("Link is required").url("Must be a valid URL").max(256, "Link must be at most 256 characters"),
      otherwise: schema => schema.notRequired(),
    }),
    file: Yup.mixed().when([], {
      is: () => selectedTab === "file",
      then: schema => schema.required("File is required"),
      otherwise: schema => schema.notRequired(),
    }),
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
            <div className="flex gap-2 mb-2">
              <Tabs
                tabs={tabs}
                onChange={id => {
                  setSelectedTab(id.toString() as UploadTab);
                  setFieldValue("isLink", id.toString() === "link");
                }}
              />
            </div>
            {selectedTab === "file" ? (
              <FileUploadBox
                onUploadSuccess={(val: File) => setFieldValue("file", val)}
                acceptedFileTypes={["Document", "Image", "Video"]}
              />
            ) : (
              <InputBase
                placeholder="Paste your link here"
                variant="filled"
                value={values.link || ""}
                onChange={(val: string) => setFieldValue("link", val)}
                error={touched.link && !!errors.link}
                helperText={touched.link && errors.link ? errors.link : ""}
              />
            )}
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
