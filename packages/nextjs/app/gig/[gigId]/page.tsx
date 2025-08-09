"use client";

import { useParams } from "next/dist/client/components/navigation";

export default function MyJobs() {
  const { gigId } = useParams();

  return (
    <div className="flex flex-col min-h-screen mt-4">
      {/* TODO: Replace with Gig Details component, use fetchApplicationsForGig */}
      <p>Gig ID: {gigId}</p>
    </div>
  );
}
