"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import BrowsePage from "~~/components/Browser";
import { fetchGigs } from "~~/services/graphql/fetchers/gig.service";
import { GigsData } from "~~/types/gig.types";

export default function BrowseGigsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<GigsData>({
    queryKey: ["gigPostings"],
    queryFn: fetchGigs,
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["gigPostings"] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  return (
    <div>
      <BrowsePage type="gig" data={data as GigsData} isLoading={isLoading} reload={reload} />
    </div>
  );
}
