"use client";

import type { NextPage } from "next";
import Button from "~~/components/Button";

const Playground: NextPage = () => {
  return (
    <div className="container mx-auto my-10">
      <Button variant="danger" onClick={() => alert("Button clicked!")}>
        Hola
      </Button>
    </div>
  );
};

export default Playground;
