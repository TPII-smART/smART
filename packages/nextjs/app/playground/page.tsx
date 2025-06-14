"use client";

import React from "react";
import type { NextPage } from "next";
import Checkbox from "~~/components/CheckBox";

const Playground: NextPage = () => {
  const [checked, setChecked] = React.useState(false);

  return (
    <div className="container mx-auto my-10">
      <Checkbox checked={checked} onChange={() => setChecked(!checked)} label="Unchecked Checkbox" />
    </div>
  );
};

export default Playground;
