"use client";

import React from "react";
import type { NextPage } from "next";
import ComboBox from "~~/components/ComboBox/ComboBox";

const Playground: NextPage = () => {
  const [age, setAge] = React.useState<string>("");

  return (
    <div className="container mx-auto my-10">
      <ComboBox
        id="age-select"
        variant="standard"
        label="age"
        onChange={v => setAge(v)}
        value={age}
        options={[{ id: "20" }, { id: "30", label: "treinta" }]}
      />
    </div>
  );
};

export default Playground;
