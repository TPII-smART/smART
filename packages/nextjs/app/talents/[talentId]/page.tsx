"use client";

import { useParams } from "next/dist/client/components/navigation";
import MyHiredTalentsListing from "@/components/MyHiredTalentsListing";

export default function Talent() {
  const { talentId } = useParams();

  return <MyHiredTalentsListing talentId={String(talentId ?? "")} />;
}
