"use client";

import { useEffect } from "react";
import { useParams } from "next/dist/client/components/navigation";
import InfoHeader from "@/components/InfoHeader";
import Spinner from "@/components/Spinner/Spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ApplicationCard from "~~/components/Card/ApplicationCard/ApplicationCard";
import { fetchGigWithApplication } from "~~/services/graphql/fetchers/gig/gig.service";
import { Application, Gig } from "~~/types/gig/gig.types";

type GigData = {
  gig: Gig;
  applications: Application[];
};

export default function GigPage() {
  const { gigId } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<GigData>({
    queryKey: ["gigWithApplication", gigId],
    queryFn: async () => {
      const result = await fetchGigWithApplication(gigId as string);
      return {
        gig: result.gig,
        applications: result.applications.applications,
      };
    },
    enabled: typeof gigId === "string" && !!gigId,
  });

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["gigWithApplication", gigId],
    });
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["gigWithApplication", gigId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="flex flex-col min-h-screen mt-8">
        <div className="w-full px-4 md:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-64">
              <Spinner />
            </div>
          ) : (
            <div>
              <InfoHeader data={data?.gig} />
              <div className="mb-8 mt-8">
                <h1 className="text-xl font-bold text-content-primary mb-4 mt-6">Manage Applications for this Gig</h1>
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
                    <p className="text-content-tertiary mt-2">Wait for freelancers to apply to your gig.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
