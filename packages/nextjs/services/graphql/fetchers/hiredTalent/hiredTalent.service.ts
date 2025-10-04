import { endpoint } from "../../config";
import * as HiredTalentQueries from "./hiredTalent.queries";
import request from "graphql-request";
import { Deliverable } from "~~/types/deliverable";
import { HiredTalent, Talent } from "~~/types/hiredTalent";
import { Paginated, PaginationMetaArg, PaginationQueryResponse } from "~~/types/paginated.types";

export const fetchMaxHiredTalentPayment = async () => {
  const res = await request<{ talents: { items: Talent[] } }>(endpoint, HiredTalentQueries.maxPayment);
  const max = res.talents.items[0]?.basePayment;
  if (!max) {
    return 0;
  }

  return Number(max) / 1e18; // Convert wei to ether
};

export const fetchTalents = async () => {
  const res = await request<{ talents: { items: Talent[] } }>(endpoint, HiredTalentQueries.getTalents);
  return { talents: res.talents.items };
};

export const fetchTalentsPaginated = async (
  meta: PaginationMetaArg,
  search: string = "",
  orderBy: keyof Talent = "createdAt",
  orderDirection: "asc" | "desc" = "desc",
  minPrice?: number,
  maxPrice?: number,
  categories?: string[],
): Promise<Paginated<Talent>> => {
  const res = await request<{ talents: PaginationQueryResponse<Talent> }>(
    endpoint,
    HiredTalentQueries.getTalentsPaginated,
    {
      limit: meta.limit,
      startCursor: meta.startCursor,
      endCursor: meta.endCursor,
      search,
      orderBy,
      orderDirection,
      minPrice: minPrice ? minPrice * 1e18 : undefined, // Convert ether to wei
      maxPrice: maxPrice ? maxPrice * 1e18 : undefined, // Convert ether to wei
      categories,
    },
  );

  const talentIds = res.talents.items.map(item => item.talentId);
  const ratings = await fetchRatingsGroupedByTalent(talentIds);
  // Calculate average rating for each talent
  const talentsWithRatings = res.talents.items.map(item => ({
    ...item,
    rating: ratings[item.talentId]?.reduce((acc, r) => acc + r, 0) / (ratings[item.talentId]?.length || 1),
  }));

  return {
    data: talentsWithRatings,
    meta: {
      endCursor: res.talents.pageInfo.endCursor,
      hasNextPage: res.talents.pageInfo.hasNextPage,
      totalCount: res.talents.totalCount,
      startCursor: res.talents.pageInfo.startCursor,
      // hasPreviousPage: res.talents.pageInfo.hasPreviousPage,
    },
  };
};

export const fetchRatingsGroupedByTalent = async (talentIds: string[]) => {
  const res = await request<{ hiredTalents: { items: HiredTalent[] } }>(
    endpoint,
    HiredTalentQueries.getRatingsByTalentIds,
    {
      talentIds,
    },
  );
  const groupedRatings = res.hiredTalents.items.reduce(
    (acc, hiredTalent) => {
      if (!acc[hiredTalent.talentId]) {
        acc[hiredTalent.talentId] = [];
      }
      if (hiredTalent.rating) {
        acc[hiredTalent.talentId].push(hiredTalent.rating);
      }
      return acc;
    },
    {} as Record<string, number[]>,
  );
  return groupedRatings;
};

export const fetchMyHiredTalentRatings = async (userAddress: string) => {
  const res = await request<{ hiredTalents: { items: HiredTalent[] } }>(
    endpoint,
    HiredTalentQueries.getMyHiredTalentRatings,
    {
      userAddress: userAddress,
    },
  );
  return { hiredTalents: res.hiredTalents.items };
};

export const fetchMyTalents = async (userAddress: string) => {
  const res = await request<{ talents: { items: Talent[] } }>(endpoint, HiredTalentQueries.getMyTalents, {
    userAddress: userAddress,
  });
  const talentIds = res.talents.items.map(item => item.talentId);
  const ratings = await fetchRatingsGroupedByTalent(talentIds);
  // Calculate average rating for each talent
  const talentsWithRatings = res.talents.items.map(item => ({
    ...item,
    rating: ratings[item.talentId]?.reduce((acc, r) => acc + r, 0) / (ratings[item.talentId]?.length || 1),
  }));
  return { talents: talentsWithRatings };
};

export const fetchMyTalentsPaginated = async (
  meta: PaginationMetaArg,
  userAddress: string,
): Promise<Paginated<Talent>> => {
  const res = await request<{ talents: PaginationQueryResponse<Talent> }>(
    endpoint,
    HiredTalentQueries.getMyTalentsPaginated,
    {
      userAddress: userAddress,
      limit: meta.limit,
      startCursor: meta.startCursor,
      endCursor: meta.endCursor,
    },
  );

  const talentIds = res.talents.items.map(item => item.talentId);
  const ratings = await fetchRatingsGroupedByTalent(talentIds);
  // Calculate average rating for each talent
  const talentsWithRatings = res.talents.items.map(item => ({
    ...item,
    rating: ratings[item.talentId]?.reduce((acc, r) => acc + r, 0) / (ratings[item.talentId]?.length || 1),
  }));

  return {
    data: talentsWithRatings,
    meta: {
      endCursor: res.talents.pageInfo.endCursor,
      hasNextPage: res.talents.pageInfo.hasNextPage,
      totalCount: res.talents.totalCount,
      startCursor: res.talents.pageInfo.startCursor,
      // hasPreviousPage: res.talents.pageInfo.hasPreviousPage,
    },
  };
};

export const fetchHiredTalentsFromTalent = async (talentId: string) => {
  const res = await request<{ hiredTalents: { items: HiredTalent[] } }>(
    endpoint,
    HiredTalentQueries.getHiredTalentsFromTalent,
    {
      talentId: talentId,
    },
  );
  return res.hiredTalents.items;
};

export const fetchHiredTalentsFromTalentPaginated = async (
  meta: PaginationMetaArg,
  talentId: string,
  search?: string,
  state?: number,
): Promise<Paginated<HiredTalent>> => {
  const res = await request<{ hiredTalents: PaginationQueryResponse<HiredTalent> }>(
    endpoint,
    HiredTalentQueries.getHiredTalentsFromTalentPaginated,
    {
      talentId: talentId,
      limit: meta.limit,
      startCursor: meta.startCursor,
      endCursor: meta.endCursor,
      search,
      state: state && state < 0 ? undefined : state,
    },
  );
  return {
    data: res.hiredTalents.items,
    meta: {
      endCursor: res.hiredTalents.pageInfo.endCursor,
      hasNextPage: res.hiredTalents.pageInfo.hasNextPage,
      totalCount: res.hiredTalents.totalCount,
      startCursor: res.hiredTalents.pageInfo.startCursor,
      // hasPreviousPage: res.hiredTalents.pageInfo.hasPreviousPage,
    },
  };
};

export const fetchTalentById = async (talentId: string) => {
  const res = await request<{ talent: Talent }>(endpoint, HiredTalentQueries.getTalentById, {
    talentId: talentId,
  });
  return res.talent;
};

export const fetchTalentWithHiredTalents = async (talentId: string) => {
  const [talent, hiredTalents] = await Promise.all([fetchTalentById(talentId), fetchHiredTalentsFromTalent(talentId)]);
  return { talent: talent, hiredTalents: hiredTalents };
};

export const fetchMyHiredTalents = async (userAddress: string) => {
  const res = await request<{ hiredTalents: { items: HiredTalent[] } }>(
    endpoint,
    HiredTalentQueries.getMyHiredTalents,
    {
      freelancer: userAddress,
    },
  );
  return { hiredTalents: res.hiredTalents.items };
};

export const fetchHires = async (userAddress: string) => {
  const res = await request<{ hiredTalents: { items: HiredTalent[] } }>(endpoint, HiredTalentQueries.getHires, {
    client: userAddress,
  });
  return { hiredTalents: res.hiredTalents.items };
};

export const fetchHiresPaginated = async (
  meta: PaginationMetaArg,
  userAddress: string,
): Promise<Paginated<HiredTalent>> => {
  const res = await request<{ hiredTalents: PaginationQueryResponse<HiredTalent> }>(
    endpoint,
    HiredTalentQueries.getHiresPaginated,
    {
      client: userAddress,
      limit: meta.limit,
      startCursor: meta.startCursor,
      endCursor: meta.endCursor,
    },
  );

  return {
    data: res.hiredTalents.items,
    meta: {
      endCursor: res.hiredTalents.pageInfo.endCursor,
      hasNextPage: res.hiredTalents.pageInfo.hasNextPage,
      totalCount: res.hiredTalents.totalCount,
      startCursor: res.hiredTalents.pageInfo.startCursor,
      // hasPreviousPage: res.hiredTalents.pageInfo.hasPreviousPage,
    },
  };
};

export const fetchTalentAverageRating = async (talentId: string) => {
  const res = await request<{ hiredTalents: { items: { rating: number }[] } }>(
    endpoint,
    HiredTalentQueries.getTalentRatings,
    {
      talentId: talentId,
    },
  );

  const averageRating = res.hiredTalents.items.length
    ? res.hiredTalents.items.reduce((acc, { rating }) => acc + rating, 0) / res.hiredTalents.items.length
    : 0;

  console.log(res);
  console.log(averageRating);

  return averageRating;
};

export const fetchHiredTalent = async (talentId: string, hiredTalentId: string) => {
  const res = await request<{ hiredTalent: HiredTalent }>(endpoint, HiredTalentQueries.getHiredTalent, {
    talentId,
    hiredTalentId,
  });
  return res.hiredTalent;
};

export const fetchHiredTalentsAndHires = async (userAddress: string) => {
  const res = await request<{ hiredTalents: { items: HiredTalent[] } }>(
    endpoint,
    HiredTalentQueries.getHiredTalentAndHires,
    {
      address: userAddress,
    },
  );
  return { hiredTalents: res.hiredTalents.items };
};

export const fetchHiredTalentsAndHiresPaginated = async (
  meta: PaginationMetaArg,
  userAddress: string,
): Promise<Paginated<HiredTalent>> => {
  const res = await request<{ hiredTalents: PaginationQueryResponse<HiredTalent> }>(
    endpoint,
    HiredTalentQueries.getHiredTalentAndHiresPaginated,
    {
      address: userAddress,
      limit: meta.limit,
      startCursor: meta.startCursor,
      endCursor: meta.endCursor,
    },
  );
  return {
    data: res.hiredTalents.items,
    meta: {
      endCursor: res.hiredTalents.pageInfo.endCursor,
      hasNextPage: res.hiredTalents.pageInfo.hasNextPage,
      totalCount: res.hiredTalents.totalCount,
      startCursor: res.hiredTalents.pageInfo.startCursor,
      // hasPreviousPage: res.hiredTalents.pageInfo.hasPreviousPage,
    },
  };
};

export const fetchDeliverablesForHiredTalent = async (talentId: string, hiredTalentId: string) => {
  const res = await request<{ hiredTalentDeliverables: { items: Deliverable[] } }>(
    endpoint,
    HiredTalentQueries.getDeliverablesForHiredTalent,
    {
      hiredTalentId,
      talentId,
    },
  );
  return res.hiredTalentDeliverables?.items ?? [];
};
