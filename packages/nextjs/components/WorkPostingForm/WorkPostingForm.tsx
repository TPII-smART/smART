"use client";

import { memo, useMemo, useState } from "react";
import { hiredTalentCategories } from "../Card/HiredTalentCategory/hiredTalentCategory.data";
import ComboBox from "../ComboBox/ComboBox";
import FileUploadBox from "../FileUploadBox";
import FormModal from "../Modal/FormModal/FormModal";
import { DurationInput, EtherInput, InputBase } from "../scaffold-eth";
import { WorkPostingFormData, WorkPostingFormProps } from "./types";
import * as yup from "yup";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { waitTransaction } from "~~/lib/waitTransaction.util";
import { uploadToIPFS } from "~~/services/IPFS/pinataIPFS";
import { Gig } from "~~/types/gig/gig.types";
import { Talent } from "~~/types/hiredTalent";
import { ScaffoldWriteContractVariables } from "~~/utils/scaffold-eth/contract";

interface HiredTalentVariant {
  contract: "HiredTalentsContract";
  formMapper: (formData: WorkPostingFormData) => {
    functionName: "createTalent";
    args: ScaffoldWriteContractVariables<"HiredTalentsContract", "createTalent">["args"];
  };
  schema: "talent";
  typeKeys: (keyof Talent)[];
}

interface GigVariant {
  contract: "GigsContract";
  formMapper: (formData: WorkPostingFormData) => {
    functionName: "createGig";
    args: ScaffoldWriteContractVariables<"GigsContract", "createGig">["args"];
  };
  schema: "gig";
  typeKeys: (keyof Gig)[];
}

function getVariant(type: "hiredTalent" | "gig"): GigVariant | HiredTalentVariant {
  switch (type) {
    case "hiredTalent":
      return {
        contract: "HiredTalentsContract",
        formMapper: (form: WorkPostingFormData) => ({
          functionName: "createTalent",
          args: Talent.mapFormDataToContractArgs(form),
        }),
        schema: "talent",
        typeKeys: Object.keys(new Talent()) as (keyof Talent)[],
      };
    case "gig":
      return {
        contract: "GigsContract",
        formMapper: (form: WorkPostingFormData) => ({
          functionName: "createGig",
          args: Gig.mapFormDataToContractArgs(form),
        }),
        schema: "gig",
        typeKeys: Object.keys(new Gig()).filter(key => key !== "userApplication") as (keyof Gig)[],
      };
  }
}

const WorkPostingForm = ({ type, refresh }: WorkPostingFormProps) => {
  const [showModal, setShowModal] = useState(false);
  const { showSpinner, hideSpinner } = useGlobalSpinner();

  const { contract, formMapper, schema, typeKeys } = useMemo(() => getVariant(type), [type]);

  const { writeContractAsync: createPosting, isMining } = useScaffoldWriteContract({
    contractName: contract,
  });

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;

    return await uploadToIPFS(file);
  };

  const handleSubmit = async (form: WorkPostingFormData) => {
    showSpinner();
    form.bannerImageHash = await handleFileUpload(form.bannerImageFile);

    try {
      const transactionHash = await createPosting(formMapper(form));
      const created = await waitTransaction<Talent & Gig>(schema, transactionHash, typeKeys);

      if (created) {
        refresh(created);
      }

      setShowModal(false);
    } catch (err) {
      console.error("Failed to create hiredTalent:", err);
    } finally {
      hideSpinner();
    }
  };

  const validationSchema = yup.object().shape({
    title: yup.string().required("Title is required").max(64, "Title must be at most 64 characters"),
    description: yup
      .string()
      .required("Description is required")
      .max(512, "Description must be at most 512 characters"),
    bannerImageHash: yup.string().optional().max(128, "Banner image hash must be at most 128 characters"),
    paymentInEth: yup
      .string()
      .required("Payment is required")
      .test("is-positive", "Payment must be positive", value => {
        if (!value) return false;
        return Number(value) > 0;
      }),
    estimatedDurationHours: yup
      .number()
      .typeError("Estimated duration must be a number")
      .required("Estimated duration is required")
      .integer("Estimated duration must be an integer")
      .min(1, "Estimated duration must be at least 1 hour"),
    category: yup
      .string()
      .required("Category is required")
      .oneOf(
        hiredTalentCategories.map(cat => cat.id),
        `Category must be one of [${hiredTalentCategories.map(cat => cat.label).join(", ")}]`,
      )
      .max(64, "Category must be at most 64 characters"),
  });

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-10 right-15 w-14 h-14 rounded-full text-white text-3xl shadow-lg hover:brightness-90 transition-all z-50 flex items-center justify-center"
        style={{ backgroundColor: "var(--color-accent)" }}
        aria-label={`Create ${type === "hiredTalent" ? "Talent" : "Gig Posting"}`}
      >
        <PlusIcon className="h-5 w-5" />
      </button>

      <FormModal
        modalProps={{
          title: `Create ${type === "hiredTalent" ? "Talent posting" : "Gig Posting"}`,
          onClose: () => setShowModal(false),
          isOpen: showModal,
          loading: isMining,
          description:
            type === "hiredTalent"
              ? "Offer your services to the community by creating a talent posting."
              : "Create a gig and look for freelancers to work on your project.",
        }}
        formikProps={{
          onSubmit: handleSubmit,
          initialValues: new WorkPostingFormData(),
          validationSchema,
        }}
      >
        {({ values, errors, touched, setFieldValue }) => (
          <div className="">
            <div className="flex gap-20 mr-10">
              <div className="">
                <InputBase
                  placeholder="Title"
                  value={values.title}
                  onChange={val => setFieldValue("title", val)}
                  error={touched.title && !!errors.title}
                  helperText={touched.title && errors.title ? errors.title : undefined}
                />
                <InputBase
                  multiline
                  minRows={4}
                  placeholder="Description"
                  value={values.description}
                  onChange={val => setFieldValue("description", val)}
                  error={touched.description && !!errors.description}
                  helperText={touched.description && errors.description ? errors.description : undefined}
                />
                <EtherInput
                  placeholder="Payment"
                  value={values.paymentInEth}
                  onChange={val => setFieldValue("paymentInEth", val)}
                  error={touched.paymentInEth && !!errors.paymentInEth}
                  helperText={touched.paymentInEth && errors.paymentInEth ? errors.paymentInEth : undefined}
                />
                <DurationInput
                  placeholder="Estimated Duration"
                  value={values.estimatedDurationHours}
                  onChange={val => setFieldValue("estimatedDurationHours", val)}
                  error={touched.estimatedDurationHours && !!errors.estimatedDurationHours}
                  helperText={
                    touched.estimatedDurationHours && errors.estimatedDurationHours
                      ? errors.estimatedDurationHours
                      : undefined
                  }
                />
                <ComboBox
                  id="category-combo"
                  label="Category"
                  value={values.category}
                  onChange={val => setFieldValue("category", val)}
                  options={hiredTalentCategories}
                  variant="standard"
                  error={touched.category && !!errors.category}
                  helperText={touched.category && errors.category ? errors.category : undefined}
                />
              </div>
              <div className="w-[70%]">
                <div className="mb-2 mt-8">
                  <label className="block text-sm mb-1">Upload Banner Image (optional)</label>
                </div>
                <FileUploadBox
                  onUploadSuccess={(val: File) => setFieldValue("bannerImageFile", val)}
                  //onUploadError={Render error message}
                  acceptedFileTypes={["Image"]}
                />
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </>
  );
};

export default memo(WorkPostingForm);
