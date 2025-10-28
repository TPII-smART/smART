import { useMemo } from "react";
import FormModal from "@/components/Modal/FormModal/FormModal";
import { InputBase } from "@/components/scaffold-eth";
import { formatEther } from "viem";
import * as yup from "yup";

export interface DisputeFormData {
  comment: string;
}

const MAX_COMMENT_LENGTH = 200;

const validationSchema = yup.object().shape({
  comment: yup.string().required("Comment is required").max(MAX_COMMENT_LENGTH, `Max ${MAX_COMMENT_LENGTH} characters`),
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
  type: "hiredTalent" | "gig";
}) {
  const formInitialValues = useMemo(
    () => ({
      comment: "",
      ...initialValues,
    }),
    [initialValues],
  );

  const formattedArbitrationFee = useMemo(() => {
    if (arbitrationFee === undefined || arbitrationFee === null) return undefined;
    try {
      const feeBigInt = typeof arbitrationFee === "bigint" ? arbitrationFee : BigInt(arbitrationFee.toString());
      return formatEther(feeBigInt);
    } catch {
      return undefined;
    }
  }, [arbitrationFee]);

  return (
    <FormModal
      modalProps={{
        title: "You are disputing this " + (type === "hiredTalent" ? "hired talent" : "gig"),
        onClose,
        isOpen,
        loading,
        description: `You will need to pay the arbitration fee${formattedArbitrationFee ? ` (${formattedArbitrationFee} ETH)` : ""}. Once you submit, the dispute cannot be canceled. The other side will have to match this fee to proceed to arbitration. If they don't then you will win the dispute by default. Once the dispute is over, the winning side will get back the arbitration fee.`,
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
            placeholder="Describe the reason for the dispute (max 200 chars)"
            value={values.comment}
            onChange={val => setFieldValue("comment", val)}
            error={touched.comment && !!errors.comment}
            helperText={touched.comment && errors.comment ? errors.comment : undefined}
            maxLength={MAX_COMMENT_LENGTH}
            multiline
            rows={3}
          />
        </div>
      )}
    </FormModal>
  );
}
