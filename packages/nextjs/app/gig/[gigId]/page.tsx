"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/dist/client/components/navigation";
import InfoHeader from "@/components/InfoHeader";
import Spinner from "@/components/Spinner/Spinner";
import { GigState } from "@se-2/common";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ApplicationCard from "~~/components/Card/ApplicationCard/ApplicationCard";
import GigDetail from "~~/components/Detail/GigDetail/gigDetail";
import { fetchGigWithApplication } from "~~/services/graphql/fetchers/gig/gig.service";
import { GigDetailType } from "~~/types/detail/detail.type";
import { Application, Gig } from "~~/types/gig";

type GigData = {
  gig: Gig;
  applications: Application[];
};

export default function GigPage() {
  const { gigId, applicationId } = useParams();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const { data, isLoading } = useQuery<GigData>({
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

  const initialItemId = searchParams?.get("itemId") || "";
  const gigState = data?.gig.state as GigState;

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["gigWithApplication", gigId],
    });
  });

  return (
    <>
      <div className="w-full h-full overflow-auto">
        <div className="flex flex-col min-h-screen mt-8">
          <div className="w-full px-4 md:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex items-center justify-center w-full h-64">
                <Spinner />
              </div>
            ) : (
              <div>
                {gigState === GigState.Open ? (
                  <div className="mb-8 mt-8">
                    <InfoHeader data={data?.gig} />
                    <h1 className="text-xl font-bold text-content-primary mb-4 mt-6">
                      Manage Applications for this Gig
                    </h1>
                    {data?.applications && data.applications.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {data?.applications.map(application => (
                          <ApplicationCard
                            key={application.applicationId}
                            application={application}
                            highlight={application.applicationId === initialItemId}
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
                ) : (
                  <div className="flex flex-col mb-4 text-start p-4 ml-2 h-full overflow-auto">
                    <h1 className="text-3xl font-bold tracking-tight text-content-primary">Gig Details</h1>
                    <p className="text-muted-foreground mt-2">View and manage your freelance Gig</p>
                    <GigDetail gigId={String(gigId)} applicationId={String(applicationId)} type={GigDetailType.final} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
