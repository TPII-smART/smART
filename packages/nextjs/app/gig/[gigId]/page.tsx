"use client";

import { useEffect } from "react";
import { useParams } from "next/dist/client/components/navigation";
import Spinner from "@/components/Spinner/Spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ApplicationCard from "~~/components/Card/ApplicationCard/ApplicationCard";
import { fetchApplicationsForGig } from "~~/services/graphql/fetchers/gig/gig.service";
import { Application } from "~~/types/gig/gig.types";

type ApplicationsData = {
  applications: Application[];
};

export default function Gig() {
  const { gigId } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<ApplicationsData>({
    queryKey: ["applicationsForGig", gigId],
    queryFn: () => fetchApplicationsForGig(gigId as string),
    enabled: typeof gigId === "string" && !!gigId,
  });

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["applicationsForGig", gigId],
    });
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["applicationsForGig", gigId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  };

  return (
    <div className="flex flex-col min-h-screen mt-4">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-content-primary mb-2">Applications for Gig {gigId}</h1>
          <p className="text-content-secondary">Manage applications for this gig.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center w-full h-64">
            <Spinner />
          </div>
        ) : (
          <div className="w-full">
            {data?.applications && data.applications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data?.applications.map(application => (
                  <ApplicationCard
                    key={application.applicationId}
                    client={application.gig?.client}
                    application={application}
                    reload={reload}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-content-secondary text-lg">No applications found.</p>
                <p className="text-content-tertiary mt-2">Start by applying to gigs that interest you.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
