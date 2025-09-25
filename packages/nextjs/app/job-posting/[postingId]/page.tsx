"use client";

import { useParams } from "next/dist/client/components/navigation";
import MyJobsListing from "@/components/MyJobsListing";

export default function JobPosting() {
  const { postingId } = useParams();

  return <MyJobsListing postingId={String(postingId ?? "")} />;
}
