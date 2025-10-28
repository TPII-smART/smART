import { endpoint } from "../../config";
import * as DisputesQueries from "./dispute.queries";
import request from "graphql-request";
import { Dispute } from "~~/types/dispute";
import { Paginated, PaginationMetaArg, PaginationQueryResponse } from "~~/types/paginated.types";

interface DisputeContributor {
  disputeId: string;
  contributor: string;
}

export const fetchAppelableDisputesPaginated = async (
  meta: PaginationMetaArg,
  search: string = "",
  orderBy: keyof Dispute = "disputeId",
  orderDirection: "asc" | "desc" = "desc",
  status?: number,
): Promise<Paginated<Dispute>> => {
  const now = Math.floor(Date.now() / 1000);
  const response = await request<{
    disputes: PaginationQueryResponse<Dispute>;
  }>(endpoint, DisputesQueries.getAppelableDisputesPaginated, {
    limit: meta.limit,
    startCursor: meta.startCursor,
    endCursor: meta.endCursor,
    search,
    orderBy,
    orderDirection,
    status: typeof status === "number" ? status : undefined,
    now,
  });

  return {
    data: response.disputes.items,
    meta: {
      endCursor: response.disputes.pageInfo.endCursor,
      hasNextPage: response.disputes.pageInfo.hasNextPage,
      totalCount: response.disputes.totalCount,
      startCursor: response.disputes.pageInfo.startCursor,
    },
  };
};

export const fetchAppelableDisputesWithContributors = async (): Promise<Paginated<Dispute>> => {
  const disputes = await fetchAppelableDisputesPaginated({ limit: 20 }, "search text", "title", "desc", 1);

  console.log("Disputes fetched:", disputes);
  if (disputes.data.length === 0) {
    return {
      data: [],
      meta: {
        endCursor: null,
        hasNextPage: false,
        totalCount: 0,
        startCursor: null,
      },
    };
  }

  const disputeIds = disputes.data.map(d => d.disputeId);

  const contributorsResponse = await request<{
    disputeContributors: PaginationQueryResponse<DisputeContributor>;
  }>(endpoint, DisputesQueries.getContributorsByDisputeIds, { disputeIds });

  const contributorsByDispute = contributorsResponse.disputeContributors.items.reduce(
    (acc, item) => {
      const disputeId = item.disputeId.toString();
      if (!acc[disputeId]) {
        acc[disputeId] = [];
      }
      acc[disputeId].push(item.contributor);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return {
    data: disputes.data.map(dispute => ({
      ...dispute,
      contributors: contributorsByDispute[dispute.disputeId.toString()] || [],
    })),
    meta: {
      endCursor: disputes.meta.endCursor,
      hasNextPage: disputes.meta.hasNextPage,
      totalCount: disputes.meta.totalCount,
      startCursor: disputes.meta.startCursor,
    },
  };
};

export const fetchDisputesIdsContributedByUserPaginated = async (
  meta: PaginationMetaArg,
  contributor: string,
): Promise<Paginated<bigint>> => {
  const response = await request<{
    disputeContributors: PaginationQueryResponse<{ disputeId: bigint }>;
  }>(endpoint, DisputesQueries.getDisputesContributedByUserPaginated, {
    contributor,
    limit: meta.limit,
    startCursor: meta.startCursor,
    endCursor: meta.endCursor,
  });

  const ids = response.disputeContributors.items.map(i => i.disputeId);

  return {
    data: ids,
    meta: {
      endCursor: response.disputeContributors.pageInfo.endCursor,
      hasNextPage: response.disputeContributors.pageInfo.hasNextPage,
      totalCount: response.disputeContributors.totalCount ?? 0,
      startCursor: response.disputeContributors.pageInfo.startCursor,
    },
  };
};

export const fetchDisputesByIds = async (disputeIds: bigint[]): Promise<Dispute[]> => {
  if (disputeIds.length === 0) {
    return [];
  }

  const response = await request<{
    disputes: PaginationQueryResponse<Dispute>;
  }>(endpoint, DisputesQueries.getDisputesByIds, { ids: disputeIds });

  return response.disputes.items;
};

export const fetchDisputeById = async (disputeId: number) => {
  const response = await request<{
    dispute: Dispute;
  }>(endpoint, DisputesQueries.getDisputesById, { id: disputeId });
  return response.dispute;
};

export const fetchDisputesContributedByUserPaginated = async (
  meta: PaginationMetaArg,
  contributor: string,
): Promise<Paginated<Dispute>> => {
  const idsPage = await fetchDisputesIdsContributedByUserPaginated(
    { limit: 20, startCursor: null, endCursor: null },
    contributor,
  );

  if (!idsPage.data || idsPage.data.length === 0) {
    return {
      data: [],
      meta: {
        endCursor: idsPage.meta.endCursor ?? null,
        hasNextPage: idsPage.meta.hasNextPage ?? false,
        totalCount: idsPage.meta.totalCount ?? 0,
        startCursor: idsPage.meta.startCursor ?? null,
      },
    };
  }

  const disputeIds = idsPage.data;
  const disputes = await fetchDisputesByIds(disputeIds);

  const contributorsResponse = await request<{
    disputeContributors: PaginationQueryResponse<DisputeContributor>;
  }>(endpoint, DisputesQueries.getContributorsByDisputeIds, {
    disputeIds,
  });

  const contributorsByDispute = contributorsResponse.disputeContributors.items.reduce(
    (acc, item) => {
      const disputeId = item.disputeId.toString();
      if (!acc[disputeId]) {
        acc[disputeId] = [];
      }
      acc[disputeId].push(item.contributor);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return {
    data: disputes.map(dispute => ({
      ...dispute,
      contributors: contributorsByDispute[dispute.disputeId.toString()] || [],
    })),
    meta: {
      endCursor: idsPage.meta.endCursor ?? null,
      hasNextPage: idsPage.meta.hasNextPage ?? false,
      totalCount: idsPage.meta.totalCount ?? 0,
      startCursor: idsPage.meta.startCursor ?? null,
    },
  };
};

export const fetchTalentIdByDisputeId = async (disputeId: number): Promise<[number | null, number | null]> => {
  const response = await request<{
    hiredTalents: { items: { talentId: number; hiredTalentId: number }[] } | null;
  }>(endpoint, DisputesQueries.getTalentIdByDisputeId, { disputeId });

  return response.hiredTalents
    ? [response.hiredTalents.items[0].talentId, response.hiredTalents.items[0].hiredTalentId]
    : [null, null];
};

export const fetchGigIdByDisputeId = async (disputeId: number): Promise<number | null> => {
  const response = await request<{
    gigs: { items: { gigId: number }[] } | null;
  }>(endpoint, DisputesQueries.getGigIdByDisputeId, { disputeId });

  return response.gigs ? response.gigs.items[0].gigId : null;
};
