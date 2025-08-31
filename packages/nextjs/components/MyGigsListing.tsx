"use client";

import Spinner from "@/components//Spinner/Spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { GigCard } from "~~/components/Card/GigCard/GigCard";
import { fetchMyGigs } from "~~/services/graphql/fetchers/gig/gig.service";
import { GigsData } from "~~/types/gig/gig.types";

export default function MyGigsListing({ userAddress }: { userAddress: string }) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<GigsData>({
    queryKey: ["gigsFromUser", userAddress],
    queryFn: () => fetchMyGigs(userAddress),
  });

  console.log(data);

  const isOwner = userAddress === address;

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["gigsFromUser", userAddress] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
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
              <p className="text-content-tertiary mt-2">
                {isOwner ? (
                  <span>
                    Go to the{" "}
                    <a href={`/browse-gigs`} className="underline">
                      Browse Gigs
                    </a>{" "}
                    page to create your first gig.
                  </span>
                ) : (
                  <span>This user has not posted any gigs yet.</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
