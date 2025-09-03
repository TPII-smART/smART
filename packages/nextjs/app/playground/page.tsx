"use client";

import React from "react";
import type { NextPage } from "next";
import Button from "~~/components/Button/Button";
import { notification } from "~~/utils/scaffold-eth";

const Playground: NextPage = () => {
  return (
    <div className="container mx-auto my-10">
      <Button
        variant="primary"
        onClick={() => {
          notification.loading({
            title: "Loading...",
            description: "UN RE TEXTO NOOO RE LARGO SABES MUUUY LARGO TANTO IBA A ESCRIBIR EL DEMENTE ESTE",
          });
          notification.success({
            title: "Loading...",
            description: "UN RE TEXTO NOOO RE LARGO SABES MUUUY LARGO TANTO IBA A ESCRIBIR EL DEMENTE ESTE",
          });
          notification.error({
            title: "Loading...",
            description: "UN RE TEXTO NOOO RE LARGO SABES MUUUY LARGO TANTO IBA A ESCRIBIR EL DEMENTE ESTE",
          });
          notification.info({
            title: "Loading...",
            description: "UN RE TEXTO NOOO RE LARGO SABES MUUUY LARGO TANTO IBA A ESCRIBIR EL DEMENTE ESTE",
          });
          notification.warning({
            title: "Loading...",
            description: "UN RE TEXTO NOOO RE LARGO SABES MUUUY LARGO TANTO IBA A ESCRIBIR EL DEMENTE ESTE",
          });
        }}
      />
    </div>
  );
};

export default Playground;
