import { useCallback } from "react";
import { InputBaseProps } from "./types";
import { hexToString, isHex, stringToHex } from "viem";
import { InputBase } from "~~/components/scaffold-eth";

export const Bytes32Input = ({ value, onChange, ...props }: InputBaseProps) => {
  const convertStringToBytes32 = useCallback(() => {
    if (!value) {
      return;
    }
    onChange(isHex(value) ? hexToString(value, { size: 32 }) : stringToHex(value, { size: 32 }));
  }, [onChange, value]);

  return (
    <InputBase
      {...props}
      value={value}
      onChange={onChange}
      suffix={
        <button
          className="self-center cursor-pointer text-xl font-semibold text-accent px-3"
          onClick={convertStringToBytes32}
          type="button"
        >
          #
        </button>
      }
    />
  );
};
