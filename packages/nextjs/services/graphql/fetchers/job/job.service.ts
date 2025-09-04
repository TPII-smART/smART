import { endpoint } from "../../config";
import * as JobQueries from "./job.queries";
import request from "graphql-request";
import { Job, JobPosting } from "~~/types/job";
import { Paginated, PaginationMetaArg, PaginationQueryResponse } from "~~/types/paginated.types";

export const fetchMaxJobPayment = async () => {
  const res = await request<{ jobPostings: { items: JobPosting[] } }>(endpoint, JobQueries.maxPayment);
  const max = res.jobPostings.items[0]?.basePayment;
  if (!max) {
    return 0;
  }

  return Number(max) / 1e18; // Convert wei to ether
};

export const fetchJobPostings = async () => {
  const res = await request<{ jobPostings: { items: JobPosting[] } }>(endpoint, JobQueries.getJobPostings);
  return { jobPostings: res.jobPostings.items };
};

export const fetchJobPostingsPaginated = async (
  meta: PaginationMetaArg,
  search: string = "",
  orderBy: keyof JobPosting = "createdAt",
  orderDirection: "asc" | "desc" = "desc",
  minPrice?: number,
  maxPrice?: number,
  categories?: string[],
): Promise<Paginated<JobPosting>> => {
  const res = await request<{ jobPostings: PaginationQueryResponse<JobPosting> }>(
    endpoint,
    JobQueries.getJobPostingsPaginated,
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

  const postingIds = res.jobPostings.items.map(item => item.postingId);
  const ratings = await fetchRatingsGroupedByPosting(postingIds);
  // Calculate average rating for each job posting
  const jobPostingsWithRatings = res.jobPostings.items.map(item => ({
    ...item,
    rating: ratings[item.postingId]?.reduce((acc, r) => acc + r, 0) / (ratings[item.postingId]?.length || 1),
  }));

  return {
    data: jobPostingsWithRatings,
    meta: {
      endCursor: res.jobPostings.pageInfo.endCursor,
      hasNextPage: res.jobPostings.pageInfo.hasNextPage,
      totalCount: res.jobPostings.totalCount,
      startCursor: res.jobPostings.pageInfo.startCursor,
      // hasPreviousPage: res.jobPostings.pageInfo.hasPreviousPage,
    },
  };
};

export const fetchRatingsGroupedByPosting = async (postingIds: string[]) => {
  const res = await request<{ jobs: { items: Job[] } }>(endpoint, JobQueries.getRatingsByPostingIds, {
    postingIds,
  });
  const groupedRatings = res.jobs.items.reduce(
    (acc, job) => {
      if (!acc[job.postingId]) {
        acc[job.postingId] = [];
      }
      if (job.rating) {
        acc[job.postingId].push(job.rating);
      }
      return acc;
    },
    {} as Record<string, number[]>,
  );
  return groupedRatings;
};

export const fetchMyJobRatings = async (userAddress: string) => {
  const res = await request<{ jobs: { items: Job[] } }>(endpoint, JobQueries.getMyJobRatings, {
    userAddress: userAddress,
  });
  return { jobs: res.jobs.items };
};

export const fetchMyJobPostings = async (userAddress: string) => {
  const res = await request<{ jobPostings: { items: JobPosting[] } }>(endpoint, JobQueries.getMyJobPostings, {
    userAddress: userAddress,
  });
  const postingIds = res.jobPostings.items.map(item => item.postingId);
  const ratings = await fetchRatingsGroupedByPosting(postingIds);
  // Calculate average rating for each job posting
  const jobPostingsWithRatings = res.jobPostings.items.map(item => ({
    ...item,
    rating: ratings[item.postingId]?.reduce((acc, r) => acc + r, 0) / (ratings[item.postingId]?.length || 1),
  }));
  return { jobPostings: jobPostingsWithRatings };
};

export const fetchJobsFromPosting = async (postingId: string) => {
  const res = await request<{ jobs: { items: Job[] } }>(endpoint, JobQueries.getJobsFromPosting, {
    postingId: postingId,
  });
  return { jobs: res.jobs.items };
};

export const fetchMyJobs = async (userAddress: string) => {
  const res = await request<{ jobs: { items: Job[] } }>(endpoint, JobQueries.getMyJobs, { freelancer: userAddress });
  return { jobs: res.jobs.items };
};

export const fetchHires = async (userAddress: string) => {
  const res = await request<{ jobs: { items: Job[] } }>(endpoint, JobQueries.getHires, { client: userAddress });
  return { jobs: res.jobs.items };
};

export const fetchJobsAndHires = async (userAddress: string) => {
  const res = await request<{ jobs: { items: Job[] } }>(endpoint, JobQueries.getJobAndHires, { address: userAddress });
  return { jobs: res.jobs.items };
};

export const fetchJobsAndHiresPaginated = async (
  meta: PaginationMetaArg,
  userAddress: string,
): Promise<Paginated<Job>> => {
  const res = await request<{ jobs: PaginationQueryResponse<Job> }>(endpoint, JobQueries.getJobAndHiresPaginated, {
    address: userAddress,
    limit: meta.limit,
    startCursor: meta.startCursor,
    endCursor: meta.endCursor,
  });
  return {
    data: res.jobs.items,
    meta: {
      endCursor: res.jobs.pageInfo.endCursor,
      hasNextPage: res.jobs.pageInfo.hasNextPage,
      totalCount: res.jobs.totalCount,
      startCursor: res.jobs.pageInfo.startCursor,
      // hasPreviousPage: res.jobs.pageInfo.hasPreviousPage,
    },
  };
};
