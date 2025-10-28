import { useMemo } from "react";
import FormModal from "@/components/Modal/FormModal/FormModal";
import { EtherInput } from "@/components/scaffold-eth";
import { formatEther } from "viem";
import * as yup from "yup";

export interface AppealFormData {
  funds: string;
}

const validationSchema = yup.object().shape({
  funds: yup
    .string()
    .required("Funds are required")
    .test("is-positive", "Funds must be positive", value => Number(value) > 0),
});

export default function AppealFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialValues,
  side,
  requiredFee,
  currentTotal,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AppealFormData) => void;
  loading?: boolean;
  initialValues?: Partial<AppealFormData>;
  side?: "client" | "freelancer";
  requiredFee?: number;
  currentTotal?: number;
  type: "hiredTalent" | "gig";
}) {
  const formInitialValues = useMemo(
    () => ({
      funds: "",
      ...initialValues,
    }),
    [initialValues],
  );

  const formattedRequiredFee = useMemo(() => {
    if (requiredFee === undefined || requiredFee === null) return undefined;
    try {
      const feeBigInt = typeof requiredFee === "bigint" ? requiredFee : BigInt(requiredFee.toString());
      return formatEther(feeBigInt);
    } catch {
      return undefined;
    }
  }, [requiredFee]);

  const formattedCurrentTotal = useMemo(() => {
    if (currentTotal === undefined || currentTotal === null) return undefined;
    try {
      const totalBigInt = typeof currentTotal === "bigint" ? currentTotal : BigInt(currentTotal.toString());
      return formatEther(totalBigInt);
    } catch {
      return undefined;
    }
  }, [currentTotal]);

  return (
    <FormModal
      modalProps={{
        title: "You are funding the appeal for this " + (type === "hiredTalent" ? "hired talent" : "gig") + " dispute",
        onClose,
        isOpen,
        loading,
        description: `You are funding the appeal for the ${side === "client" ? "client" : "freelancer"}'s side. The total required fee is ${
          formattedRequiredFee ? `(${formattedRequiredFee} ETH)` : ""
        }. The current total funded is ${formattedCurrentTotal ? `(${formattedCurrentTotal} ETH)` : ""}.`,
      }}
      formikProps={{
        onSubmit,
        initialValues: formInitialValues,
        validationSchema,
      }}
    >
      {({ values, errors, touched, setFieldValue }) => (
        <div className="flex flex-col gap-4">
          <EtherInput
            label="Funds to contribute (ETH)"
            placeholder="Funds (ETH)"
            value={values.funds}
            onChange={val => setFieldValue("funds", val)}
            error={touched.funds && !!errors.funds}
            helperText={touched.funds && errors.funds ? errors.funds : undefined}
          />
        </div>
      )}
    </FormModal>
  );
}
