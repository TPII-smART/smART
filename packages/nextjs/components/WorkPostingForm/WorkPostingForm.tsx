"use client";

import { useMemo, useState } from "react";
import { jobCategories } from "../Card/JobCategory/jobCategory.data";
import ComboBox from "../ComboBox/ComboBox";
import FileUploadBox from "../FileUploadBox";
import FormModal from "../Modal/FormModal/FormModal";
import { EtherInput, InputBase } from "../scaffold-eth";
import { WorkPostingFormData, WorkPostingFormProps } from "./types";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { waitTransaction } from "~~/lib/utils";
import { uploadToIPFS } from "~~/services/IPFS/thirdwebIPFS";
import { Gig } from "~~/types/gig/gig.types";
import { JobPosting } from "~~/types/job";
import { ScaffoldWriteContractVariables } from "~~/utils/scaffold-eth/contract";

interface JobVariant {
  contract: "JobsContract";
  formMapper: (formData: WorkPostingFormData) => {
    functionName: "createJobPosting";
    args: ScaffoldWriteContractVariables<"JobsContract", "createJobPosting">["args"];
  };
}

interface GigVariant {
  contract: "GigsContract";
  formMapper: (formData: WorkPostingFormData) => {
    functionName: "createGig";
    args: ScaffoldWriteContractVariables<"GigsContract", "createGig">["args"];
  };
}

function getVariant(type: "job" | "gig"): GigVariant | JobVariant {
  switch (type) {
    case "job":
      return {
        contract: "JobsContract",
        formMapper: (form: WorkPostingFormData) => ({
          functionName: "createJobPosting",
          args: JobPosting.mapFormDataToContractArgs(form),
        }),
      };
    case "gig":
      return {
        contract: "GigsContract",
        formMapper: (form: WorkPostingFormData) => ({
          functionName: "createGig",
          args: Gig.mapFormDataToContractArgs(form),
        }),
      };
  }
}

const WorkPostingForm = ({ type, refresh }: WorkPostingFormProps) => {
  const [showModal, setShowModal] = useState(false);

  const { contract, formMapper } = useMemo(() => getVariant(type), [type]);

  const { writeContractAsync: createPosting, isMining } = useScaffoldWriteContract({
    contractName: contract,
  });

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;

    return await uploadToIPFS(file);
  };

  const handleSubmit = async (form: WorkPostingFormData) => {
    form.bannerImageHash = await handleFileUpload(form.bannerImageFile);

    try {
      const transactionHash = await createPosting(formMapper(form));
      await waitTransaction("jobPosting", transactionHash);
      await refresh();
      setShowModal(false);
    } catch (err) {
      console.error("Failed to create job:", err);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-10 right-15 w-14 h-14 rounded-full text-white text-3xl shadow-lg hover:brightness-90 transition-all z-50 flex items-center justify-center"
        style={{ backgroundColor: "var(--color-accent)" }}
        aria-label={`Create ${type === "job" ? "Job Posting" : "Gig Posting"}`}
      >
        <PlusIcon className="h-5 w-5" />
      </button>

      <FormModal
        modalProps={{
          title: `Create ${type === "job" ? "Job Posting" : "Gig Posting"}`,
          onClose: () => setShowModal(false),
          isOpen: showModal,
          loading: isMining,
          description:
            type === "job"
              ? "Offer your services to the community by creating a job posting."
              : "Create a gig and look for freelancers to work on your project.",
        }}
        formikProps={{
          onSubmit: handleSubmit,
          initialValues: new WorkPostingFormData(),
        }}
      >
        {({ values, setFieldValue }) => (
          <div className="space-y-4">
            <InputBase placeholder="Title" value={values.title} onChange={val => setFieldValue("title", val)} />
            <InputBase
              placeholder="Description"
              value={values.description}
              onChange={val => setFieldValue("description", val)}
            />
            <FileUploadBox
              onUploadSuccess={(val: File) => setFieldValue("bannerImageFile", val)}
              //onUploadError={Render error message}
              acceptedFileType={"Image"}
            />
            <EtherInput
              placeholder="Payment"
              value={values.paymentInEth}
              onChange={val => setFieldValue("paymentInEth", val)}
            />
            <InputBase
              placeholder="Estimated Duration (hours)"
              value={values.estimatedDurationHours}
              onChange={val => setFieldValue("estimatedDurationHours", val)}
            />
            <ComboBox
              id="category-combo"
              label="Category"
              value={values.category}
              onChange={val => setFieldValue("category", val)}
              options={jobCategories}
              variant="standard"
            />
          </div>
        )}
      </FormModal>
    </>
  );
};

export default WorkPostingForm;
