"use client";

import Spinner from "@/components//Spinner/Spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ApplicationCard from "~~/components/Card/ApplicationCard/ApplicationCard";
import { fetchApplicationsWithGigDetails } from "~~/services/graphql/fetchers/gig/gig.service";
import { Application } from "~~/types/gig/gig.types";

type ApplicationsData = {
  applications: Application[];
};

export default function ApplicationsListing({ userAddress }: { userAddress: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<ApplicationsData>({
    queryKey: ["applicationsFromUser", userAddress],
    queryFn: async () => {
      const result = await fetchApplicationsWithGigDetails(userAddress);
      console.log("Query function result:", result);
      return result;
    },
    enabled: !!userAddress, // Only run query if userAddress exists
    staleTime: 0, // Force fresh data
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["applicationsFromUser", userAddress] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  };

  console.log(
    "Application id",
    data?.applications.map(app => app.applicationId),
  );

  console.log(
    "Gig Ids",
    data?.applications.map(app => app.gig?.gigId),
  );

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 mt-6 mb-6">
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
                  key={`${application.gig?.gigId}-${application.applicationId}`}
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
  );
}
