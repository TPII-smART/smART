"use client";

import React from "react";
import type { NextPage } from "next";
import * as SETH from "~~/components/scaffold-eth";

const Playground: NextPage = () => {
  const [age, setAge] = React.useState<string>("");

  return (
    <div className="container mx-auto my-10">
      <SETH.InputBase
        value={age}
        onChange={setAge}
        placeholder="Enter your age"
        label="Age"
        error={true}
        helperText="asjkas"
        variant="filled"
      />
      <SETH.AddressInput
        value={age}
        onChange={setAge}
        placeholder="Enter your age"
        label="Age"
        error={true}
        helperText="asjkas"
        variant="filled"
      />
      <SETH.IntegerInput
        value={age}
        onChange={setAge}
        placeholder="Enter your age"
        label="Age"
        error={true}
        helperText="asjkas"
        variant="filled"
      />
      <SETH.BytesInput
        value={age}
        onChange={setAge}
        placeholder="Enter your age"
        label="Age"
        error={true}
        helperText="asjkas"
        variant="filled"
      />
      <SETH.EtherInput
        value={age}
        onChange={setAge}
        placeholder="Enter your age"
        label="Age"
        error={true}
        helperText="asjkas"
        variant="filled"
      />
      <SETH.Bytes32Input
        value={age}
        onChange={setAge}
        placeholder="Enter your age"
        label="Age"
        error={true}
        helperText="asjkas"
        variant="filled"
      />
    </div>
  );
};

export default Playground;
