import { useMemo } from "react";
import Checkbox from "@/components/CheckBox/CheckBox";
import FormModal from "@/components/Modal/FormModal/FormModal";
import { EtherInput, InputBase } from "@/components/scaffold-eth";
import { formatEther, parseEther } from "viem";
import * as yup from "yup";

export interface DisputeFormData {
  comment: string;
  bounty: string;
  bond: string;
  arbitration: boolean;
}

const MAX_COMMENT_LENGTH = 200;

const validationSchema = yup.object().shape({
  comment: yup.string().required("Comment is required").max(MAX_COMMENT_LENGTH, `Max ${MAX_COMMENT_LENGTH} characters`),
  bounty: yup
    .string()
    .required("Bounty is required")
    .test("is-positive", "Bounty must be positive", value => Number(value) > 0),
  bond: yup
    .string()
    .required("Bond is required")
    .test("is-positive", "Bond must be positive", value => Number(value) > 0),
  arbitration: yup.boolean(),
});

export default function DisputeFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialValues,
  arbitrationFee,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: DisputeFormData) => void;
  loading?: boolean;
  initialValues?: Partial<DisputeFormData>;
  arbitrationFee?: string;
  type: "job" | "gig";
}) {
  const formInitialValues = useMemo(
    () => ({
      comment: "",
      bounty: "",
      bond: "",
      arbitration: false,
      ...initialValues,
    }),
    [initialValues],
  );

  return (
    <FormModal
      modalProps={{
        title: "You are disputing this " + (type === "job" ? "job" : "gig"),
        onClose,
        isOpen,
        loading,
        description: `Initiating a dispute will create a question on Reality.ETH. You will need to pay a bounty (as reward for the question) and a bond (to provide a first answer). If you choose going straight into arbitration, you will also need to pay the arbitration fee${arbitrationFee ? ` (${formatEther(BigInt(arbitrationFee))} ETH)` : ""}.`,
      }}
      formikProps={{
        onSubmit,
        initialValues: formInitialValues,
        validationSchema,
      }}
    >
      {({ values, errors, touched, setFieldValue }) => (
        <div className="flex flex-col gap-4">
          <InputBase
            label="Comment"
            placeholder="Describe the dispute (max 200 chars)"
            value={values.comment}
            onChange={val => setFieldValue("comment", val)}
            error={touched.comment && !!errors.comment}
            helperText={touched.comment && errors.comment ? errors.comment : undefined}
            maxLength={MAX_COMMENT_LENGTH}
            multiline
            rows={3}
          />
          <EtherInput
            label="Bounty Fee"
            placeholder="Bounty (ETH)"
            value={values.bounty}
            onChange={val => setFieldValue("bounty", val)}
            error={touched.bounty && !!errors.bounty}
            helperText={touched.bounty && errors.bounty ? errors.bounty : undefined}
          />
          <EtherInput
            label="Bond Fee"
            placeholder="Bond (ETH)"
            value={values.bond}
            onChange={val => setFieldValue("bond", val)}
            error={touched.bond && !!errors.bond}
            helperText={touched.bond && errors.bond ? errors.bond : undefined}
          />
          <Checkbox
            label="Go straight to arbitration"
            checked={values.arbitration}
            onChange={checked => setFieldValue("arbitration", checked)}
          />
          <div className="flex flex-col gap-2">
            Total to pay:{" "}
            {formatEther(
              parseEther(values.bounty) +
                parseEther(values.bond) +
                (values.arbitration && arbitrationFee ? BigInt(arbitrationFee || "0") : BigInt(0)),
            )}{" "}
            ETH
          </div>
        </div>
      )}
    </FormModal>
  );
}
