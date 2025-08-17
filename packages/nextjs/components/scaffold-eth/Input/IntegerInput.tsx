import { useCallback, useEffect, useState } from "react";
import { IntegerInputProps } from "./types";
import { parseEther } from "viem";
import { InputBase, IntegerVariant, isValidInteger } from "~~/components/scaffold-eth";

export const IntegerInput = ({
  intVariant = IntegerVariant.UINT256,
  disableMultiplyBy1e18 = false,
  value,
  onChange,
  ...props
}: IntegerInputProps) => {
  const [inputError, setInputError] = useState(false);
  const multiplyBy1e18 = useCallback(() => {
    if (!value) {
      return;
    }
    return onChange(parseEther(value).toString());
  }, [onChange, value]);

  useEffect(() => {
    if (isValidInteger(intVariant, value)) {
      setInputError(false);
    } else {
      setInputError(true);
    }
  }, [value, intVariant]);

  return (
    <InputBase
      {...props}
      value={value}
      error={inputError}
      onChange={onChange}
      suffix={
        !inputError &&
        !disableMultiplyBy1e18 && (
          <div
            className="space-x-4 flex tooltip tooltip-top tooltip-secondary before:content-[attr(data-tip)] before:right-[-10px] before:left-auto before:transform-none"
            data-tip="Multiply by 1e18 (wei)"
          >
            <button
              className={`${props.disabled ? "cursor-not-allowed" : "cursor-pointer"} font-semibold px-4 text-accent`}
              onClick={multiplyBy1e18}
              disabled={props.disabled}
              type="button"
            >
              ∗
            </button>
          </div>
        )
      }
    />
  );
};
