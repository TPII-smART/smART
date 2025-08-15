import { endpoint } from "../../config";
import * as JobQueries from "./job.queries";
import request from "graphql-request";
import { Job, JobPosting } from "~~/types/job";
import { Paginated, PaginationQueryResponse } from "~~/types/paginated.types";

export const fetchMaxJobPayment = async () => {
  const res = await request<{ jobPostings: { items: JobPosting[] } }>(endpoint, JobQueries.maxPayment);
  const payments = res.jobPostings.items.map(item => Number(item.basePayment) || 0);
  const max = payments.length > 0 ? Math.max(...payments) : 0;
  return max / 1e18; // Convert wei to ether
};

export const fetchJobPostings = async () => {
  const res = await request<{ jobPostings: { items: JobPosting[] } }>(endpoint, JobQueries.getJobPostings);
  return { jobPostings: res.jobPostings.items };
};

export const fetchJobPostingsPaginated = async (
  search: string = "",
  orderBy: keyof JobPosting = "createdAt",
  orderDirection: "asc" | "desc" = "desc",
  minPrice?: number,
  maxPrice?: number,
): Promise<Paginated<JobPosting>> => {
  const res = await request<{ jobPostings: PaginationQueryResponse<JobPosting> }>(
    endpoint,
    JobQueries.getJobPostingsPaginated,
    { search, orderBy, orderDirection, minPrice, maxPrice },
  );

  return {
    data: res.jobPostings.items,
    meta: {
      endCursor: res.jobPostings.pageInfo.endCursor,
      hasNextPage: res.jobPostings.pageInfo.hasNextPage,
      totalCount: res.jobPostings.totalCount,
    },
  };
};

export const fetchMyJobPostings = async (userAddress: string) => {
  const res = await request<{ jobPostings: { items: JobPosting[] } }>(endpoint, JobQueries.getMyJobPostings, {
    userAddress: userAddress,
  });
  return { jobPostings: res.jobPostings.items };
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
