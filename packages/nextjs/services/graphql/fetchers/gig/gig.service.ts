import { endpoint } from "../../config";
import * as GigQueries from "./gig.queries";
import request from "graphql-request";
import { Application, Gig } from "~~/types/gig";
import { Paginated, PaginationMetaArg, PaginationQueryResponse } from "~~/types/paginated.types";

export const fetchMaxGigPayment = async () => {
  const res = await request<{ gigs: { items: Gig[] } }>(endpoint, GigQueries.maxPayment);
  return (Number(res.gigs.items[0]?.basePayment) ?? 0) / 1e18; // Convert wei to ether
};

export const fetchGigs = async () => {
  const res = await request<{ gigs: { items: Gig[] } }>(endpoint, GigQueries.getGigs);
  return { gigs: res.gigs.items };
};

export const fetchGigsPaginated = async (
  meta: PaginationMetaArg,
  search: string = "",
  orderBy: keyof Gig = "createdAt",
  orderDirection: "asc" | "desc" = "desc",
  minPayment?: number,
  maxPayment?: number,
): Promise<Paginated<Gig>> => {
  const res = await request<{ gigs: PaginationQueryResponse<Gig> }>(endpoint, GigQueries.getGigsPaginated, {
    limit: meta.limit,
    startCursor: meta.startCursor,
    endCursor: meta.endCursor,
    search,
    orderBy,
    orderDirection,
    minPayment: minPayment ? minPayment * 1e18 : undefined, // Convert ether to wei
    maxPayment: maxPayment ? maxPayment * 1e18 : undefined, // Convert ether to wei
  });

  return {
    data: res.gigs.items,
    meta: {
      endCursor: res.gigs.pageInfo.endCursor,
      hasNextPage: res.gigs.pageInfo.hasNextPage,
      totalCount: res.gigs.totalCount,
      startCursor: res.gigs.pageInfo.startCursor,
    },
  };
};

export const fetchMyGigs = async (userAddress: string) => {
  const res = await request<{ gigs: { items: Gig[] } }>(endpoint, GigQueries.getMyGigs, { userAddress: userAddress });
  return { gigs: res.gigs.items };
};

export const fetchApplications = async (userAddress: string) => {
  const res = await request<{ gigApplications: { items: Application[] } }>(endpoint, GigQueries.getMyApplications, {
    userAddress: userAddress,
  });
  return { applications: res.gigApplications.items };
};

export const fetchApplicationsWithGigDetails = async (userAddress: string) => {
  const res = await request<{ gigApplications: { items: Application[] } }>(endpoint, GigQueries.getMyApplications, {
    userAddress: userAddress,
  });
  const gigIds = res.gigApplications.items.map(app => app.gigId);
  const uniqueGigIds = Array.from(new Set(gigIds));

  // Convert gigIds to strings for GraphQL query (BigInt values need to be sent as strings)
  const stringGigIds = uniqueGigIds.map(id => id.toString());

  const resGigs = await request<{ gigs: { items: Gig[] } }>(endpoint, GigQueries.getGigByIds, {
    gigIds: stringGigIds,
  });
  const gigsMap = new Map(resGigs.gigs.items.map(gig => [gig.gigId, gig]));
  const applicationsWithGigDetails = res.gigApplications.items.map(app => ({
    ...app,
    gig: gigsMap.get(app.gigId),
  }));
  return { applications: applicationsWithGigDetails };
};

export const fetchApplicationsForGig = async (gigId: string) => {
  const res = await request<{ gigApplications: { items: Application[] } }>(endpoint, GigQueries.getApplicationsForGig, {
    gigId: gigId,
  });
  return { applications: res.gigApplications.items };
};

export const fetchGigById = async (gigId: string) => {
  const res = await request<{ gig: Gig }>(endpoint, GigQueries.getGigById, { gigId: gigId });
  return res.gig;
};
