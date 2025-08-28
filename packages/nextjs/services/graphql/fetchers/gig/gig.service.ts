import { endpoint } from "../../config";
import * as GigQueries from "./gig.queries";
import request from "graphql-request";
import { Application, Gig } from "~~/types/gig";
import { Paginated, PaginationMetaArg, PaginationQueryResponse } from "~~/types/paginated.types";

export const fetchMaxGigPayment = async () => {
  const res = await request<{ gigs: { items: Gig[] } }>(endpoint, GigQueries.maxPayment);
  const max = res.gigs.items[0]?.basePayment;
  if (!max) {
    return 0;
  }

  return Number(max) / 1e18; // Convert wei to ether
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
  categories?: string[],
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
    categories,
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

export const fetchApplicationsWithGigDetailsPaginated = async (
  meta: PaginationMetaArg,
  userAddress: string,
): Promise<Paginated<Application>> => {
  const res = await request<{ gigApplications: PaginationQueryResponse<Application> }>(
    endpoint,
    GigQueries.getMyApplicationsPaginated,
    {
      userAddress: userAddress,
      limit: meta.limit,
      startCursor: meta.startCursor,
      endCursor: meta.endCursor,
    },
  );
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
  return {
    data: applicationsWithGigDetails,
    meta: {
      endCursor: res.gigApplications.pageInfo.endCursor,
      hasNextPage: res.gigApplications.pageInfo.hasNextPage,
      totalCount: res.gigApplications.totalCount,
      startCursor: res.gigApplications.pageInfo.startCursor,
      // hasPreviousPage: res.gigApplications.pageInfo.hasPreviousPage,
    },
  };
};

export const fetchApplicationsForMyGigs = async (userAddress: string) => {
  const gigsRes = await request<{ gigs: { items: Gig[] } }>(endpoint, GigQueries.getMyGigs, { userAddress });
  const gigIds = gigsRes.gigs.items.map(gig => gig.gigId.toString());
  if (gigIds.length === 0) return { applications: [] };

  const res = await request<{ gigApplications: { items: Application[] } }>(
    endpoint,
    GigQueries.getApplicationsForGigs,
    { gigIds },
  );
  const applications = res.gigApplications.items;

  const resGigs = await request<{ gigs: { items: Gig[] } }>(endpoint, GigQueries.getGigByIds, { gigIds });
  const gigsMap = new Map(resGigs.gigs.items.map(gig => [gig.gigId.toString(), gig]));

  const applicationsWithGigDetails = applications.map(app => ({
    ...app,
    gig: gigsMap.get(app.gigId.toString()),
  }));

  return { applications: applicationsWithGigDetails };
};

export const fetchApplicationsForMyGigsPaginated = async (
  meta: PaginationMetaArg,
  userAddress: string,
): Promise<Paginated<Application>> => {
  const gigsRes = await request<{ gigs: PaginationQueryResponse<Gig> }>(endpoint, GigQueries.getMyGigsPaginated, {
    userAddress,
    limit: meta.limit,
    startCursor: meta.startCursor,
    endCursor: meta.endCursor,
  });
  const gigIds = gigsRes.gigs.items.map(gig => gig.gigId.toString());
  if (gigIds.length === 0)
    return {
      data: [],
      meta: {
        endCursor: gigsRes.gigs.pageInfo.endCursor,
        hasNextPage: gigsRes.gigs.pageInfo.hasNextPage,
        totalCount: gigsRes.gigs.totalCount,
        startCursor: gigsRes.gigs.pageInfo.startCursor,
        // hasPreviousPage: res.gigApplications.pageInfo.hasPreviousPage,
      },
    };

  const res = await request<{ gigApplications: { items: Application[] } }>(
    endpoint,
    GigQueries.getApplicationsForGigs,
    { gigIds },
  );
  const applications = res.gigApplications.items;

  const resGigs = await request<{ gigs: { items: Gig[] } }>(endpoint, GigQueries.getGigByIds, { gigIds });
  const gigsMap = new Map(resGigs.gigs.items.map(gig => [gig.gigId.toString(), gig]));

  const applicationsWithGigDetails = applications.map(app => ({
    ...app,
    gig: gigsMap.get(app.gigId.toString()),
  }));

  return {
    data: applicationsWithGigDetails,
    meta: {
      endCursor: gigsRes.gigs.pageInfo.endCursor,
      hasNextPage: gigsRes.gigs.pageInfo.hasNextPage,
      totalCount: gigsRes.gigs.totalCount,
      startCursor: gigsRes.gigs.pageInfo.startCursor,
      // hasPreviousPage: res.gigApplications.pageInfo.hasPreviousPage,
    },
  };
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
