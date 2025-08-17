import { useCallback } from "react";
import { InputBaseProps } from "./types";
import { bytesToString, isHex, toBytes, toHex } from "viem";
import { InputBase } from "~~/components/scaffold-eth";

export const BytesInput = ({ value, onChange, ...props }: InputBaseProps) => {
  const convertStringToBytes = useCallback(() => {
    onChange(isHex(value) ? bytesToString(toBytes(value)) : toHex(toBytes(value)));
  }, [onChange, value]);

  return (
    <InputBase
      {...props}
      value={value}
      onChange={onChange}
      suffix={
        <button
          className="self-center cursor-pointer text-xl font-semibold text-accent px-3"
          onClick={convertStringToBytes}
          type="button"
        >
          #
        </button>
      }
    />
  );
};
