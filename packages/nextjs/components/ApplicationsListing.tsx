"use client";

import React from "react";
import Spinner from "@/components//Spinner/Spinner";
import ApplicationCard from "~~/components/Card/ApplicationCard/ApplicationCard";
import { usePagination } from "~~/hooks/use-pagination";
import { fetchApplicationsWithGigDetailsPaginated } from "~~/services/graphql/fetchers/gig/gig.service";
import { Application } from "~~/types/gig/gig.types";

export default function ApplicationsListing({ userAddress }: { userAddress: string }) {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const { handleScroll, fetchPaginatedData } = usePagination({
    loadingFunction: setLoading,
    setDataFunction: setApplications,
    fetchFunction: fetchApplicationsWithGigDetailsPaginated,
  });

  React.useEffect(() => {
    if (!userAddress) return;

    fetchPaginatedData(true, "applications", userAddress);
  }, [userAddress, fetchPaginatedData]);

  return (
    <div
      className="w-full px-4 md:px-6 lg:px-8 mt-6 mb-6 overflow-auto max-h-[inherit]"
      onScroll={e => handleScroll(e, "applications", userAddress)}
    >
      <div className="w-full">
        {applications && applications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <>
              {applications.map(application => (
                <ApplicationCard
                  key={`${application.gig?.gigId}-${application.applicationId}`}
                  application={application}
                  variant="profile"
                />
              ))}
              {loading && (
                <div className="flex items-center justify-center w-full h-64">
                  <Spinner />
                </div>
              )}
            </>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-content-secondary text-lg">No applications found.</p>
            <p className="text-content-tertiary mt-2">Start by applying to gigs that interest you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
