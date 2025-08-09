"use client";

import Spinner from "@/components//Spinner/Spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GigCard } from "~~/components/Card/GigCard/GigCard";
import { fetchMyGigs } from "~~/services/graphql/fetchers/gig.service";
import { GigsData } from "~~/types/gig.types";

export default function MyGigsListing({ userAddress }: { userAddress: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<GigsData>({
    queryKey: ["gigsFromUser", userAddress],
    queryFn: () => fetchMyGigs(userAddress),
  });

  console.log(data);

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["gigsFromUser", userAddress] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content-primary mb-2">My Gigs</h1>
        <p className="text-content-secondary">Manage your active and completed gigs</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center w-full h-64">
          <Spinner />
        </div>
      ) : (
        <div className="w-full">
          {data?.gigs && data.gigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data?.gigs.map(gig => <GigCard key={gig.gigId} gig={gig} reload={reload} />)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-content-secondary text-lg">No gigs found.</p>
              <p className="text-content-tertiary mt-2">Start by browsing available gigs or posting your own.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
