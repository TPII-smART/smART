"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import InfoHeader from "@/components/InfoHeader";
import Spinner from "@/components/Spinner/Spinner";
import ApplicationCard from "~~/components/Card/ApplicationCard/ApplicationCard";
import GigDetail from "~~/components/Detail/GigDetail/gigDetail";
import Skeleton from "~~/components/Skeleton/Skeleton";
import { usePagination } from "~~/hooks/use-pagination";
import { fetchGigById, getApplicationsForGigPaginated } from "~~/services/graphql/fetchers/gig/gig.service";
import { GigDetailType } from "~~/types/detail/detail.type";
import { Application, Gig } from "~~/types/gig";
import { GigState } from "~~/types/gig/gig.types";

export default function GigPage() {
  const { gigId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId") || "";
  const initialItemId = searchParams?.get("itemId") || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [gig, setGig] = useState<Gig | undefined>(undefined);

  const { handleScroll, fetchPaginatedData } = usePagination({
    fetchFunction: getApplicationsForGigPaginated,
    loadingFunction: setLoading,
    setDataFunction: setApplications,
  });

  useEffect(() => {
    setIsValidating(true);
    if (!gigId) {
      router.replace("/404");
      return;
    }

    const fetchData = async (gigId: string) => {
      const _gig = await fetchGigById(gigId);
      if (!_gig) {
        router.replace("/404");
        return;
      }
      setGig(_gig);
      fetchPaginatedData(true, "gigApplications", _gig);
      setIsValidating(false);
    };

    fetchData(gigId as string);
  }, [gigId, fetchPaginatedData, router]);

  const gigState = gig?.state as GigState;

  console.log("Gig Page Rendered:", { gigId, gig, applications });
  console.log("Application ID:", applicationId);

  return (
    <>
      <div className="w-full h-full overflow-auto" onScroll={e => handleScroll(e, "gigApplications", gig ?? { gigId })}>
        <div className="flex flex-col min-h-screen">
          <div className="w-full px-4 md:px-6 lg:px-8">
            <div>
              {isValidating ? (
                <div className="mb-8 mt-8">
                  <Skeleton active variant="rounded" width={"100%"} height={200} />
                  <h1 className="text-xl font-bold text-content-primary mb-4 mt-6">Manage Applications for this Gig</h1>
                  <div className="flex items-center justify-center w-full h-64">
                    <Spinner />
                  </div>
                </div>
              ) : gigState === GigState.Open && !applicationId ? (
                <div className="mb-8 mt-8">
                  <Skeleton active={!gig} variant="rounded" width={"100%"}>
                    <InfoHeader data={gig} />
                  </Skeleton>
                  <h1 className="text-xl font-bold text-content-primary mb-4 mt-6">Manage Applications for this Gig</h1>
                  {applications && applications.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {applications.map(application => (
                          <ApplicationCard
                            key={application.applicationId}
                            application={application}
                            highlight={application.applicationId === initialItemId}
                            variant="gig"
                          />
                        ))}
                      </div>
                      {loading && (
                        <div className="flex items-center justify-center w-full h-64">
                          <Spinner />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-content-secondary text-lg">No applications found.</p>
                      <p className="text-content-tertiary mt-2">Wait for freelancers to apply to your gig.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col mb-4 text-start p-4 ml-2 h-full overflow-auto">
                  {gig?.acceptedApplicationId ? (
                    <>
                      <h1 className="text-3xl font-bold tracking-tight text-content-primary">Gig Details</h1>
                      <p className="text-muted-foreground mt-2">View and manage your freelance Gig</p>

                      <GigDetail gigId={String(gigId)} applicationId={applicationId} type={GigDetailType.final} />
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold tracking-tight text-content-primary">Application Details</h1>
                      <p className="text-muted-foreground mt-2">View and manage your freelance application</p>
                      <GigDetail
                        gigId={String(gigId)}
                        applicationId={String(applicationId)}
                        type={GigDetailType.partial}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
