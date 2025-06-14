"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { InputBase } from "~~/components/scaffold-eth";

const Playground: NextPage = () => {
  const [state, setState] = useState<string>("");

  return (
    <div className="container mx-auto my-10">
      <InputBase
        onChange={setState}
        value={state}
        placeholder="Email"
        maxLength={50}
        suffix={
          <button className={`font-semibold px-4 text-accent mb-1`} type="button">
            ∗
          </button>
        }
      />
    </div>
  );
};

export default Playground;
