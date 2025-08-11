import { endpoint } from "../config";
import request, { gql } from "graphql-request";
import { Job, JobPosting } from "~~/types/job.types";

export const fetchMaxJobPayment = async () => {
  const query = gql`
    query GetJobPostingsPayments {
      jobPostings {
        items {
          basePayment
        }
      }
    }
  `;

  const res = await request<{ jobPostings: { items: JobPosting[] } }>(endpoint, query);
  const payments = res.jobPostings.items.map(item => Number(item.basePayment) || 0);
  const max = payments.length > 0 ? Math.max(...payments) : 0;
  return max / 1e18; // Convert wei to ether
};

export const fetchJobPostings = async () => {
  const query = gql`
    query GetJobPostings {
      jobPostings(orderBy: "createdAt", orderDirection: "desc") {
        items {
          postingId
          freelancer
          basePayment
          title
          description
          category
          bannerImageHash
          minimumNoticeTime
          averageWorkDuration
          createdAt
        }
      }
    }
  `;

  const res = await request<{ jobPostings: { items: JobPosting[] } }>(endpoint, query);
  return { jobPostings: res.jobPostings.items };
};

export const fetchMyJobPostings = async (userAddress: string) => {
  console.log("fetchMyJobPostings", userAddress);

  const query = gql`
    query GetJobPostings($userAddress: String!) {
      jobPostings(where: { freelancer: $userAddress }, orderBy: "createdAt", orderDirection: "desc") {
        items {
          postingId
          freelancer
          basePayment
          title
          description
          category
          bannerImageHash
          minimumNoticeTime
          averageWorkDuration
          createdAt
        }
      }
    }
  `;

  const res = await request<{ jobPostings: { items: JobPosting[] } }>(endpoint, query, { userAddress: userAddress });
  return { jobPostings: res.jobPostings.items };
};

export const fetchJobsFromPosting = async (postingId: string) => {
  console.log("fetchJobsFromPosting", postingId);

  const query = gql`
    query GetJobs($postingId: BigInt!) {
      jobs(where: { postingId: $postingId }, orderBy: "acceptedAt", orderDirection: "desc") {
        items {
          jobId
          postingId
          client
          freelancer
          payment
          title
          description
          category
          bannerImageHash
          jobDuration
          deadline
          state
          createdAt
          acceptedAt
          finishedAt
          canceledAt
          clientReceived
          freelancerDelivered
        }
      }
    }
  `;

  const res = await request<{ jobs: { items: Job[] } }>(endpoint, query, { postingId: postingId });
  return { jobs: res.jobs.items };
};

export const fetchMyJobs = async (userAddress: string) => {
  console.log("fetchMyJobs", userAddress);

  const query = gql`
    query GetJobs($freelancer: String!) {
      jobs(where: { freelancer: $freelancer }, orderBy: "acceptedAt", orderDirection: "desc") {
        items {
          jobId
          postingId
          client
          freelancer
          payment
          title
          description
          category
          bannerImageUrl
          jobDuration
          deadline
          state
          createdAt
          acceptedAt
          finishedAt
          canceledAt
          clientReceived
          freelancerDelivered
        }
      }
    }
  `;

  const res = await request<{ jobs: { items: Job[] } }>(endpoint, query, { freelancer: userAddress });
  return { jobs: res.jobs.items };
};

export const fetchHires = async (userAddress: string) => {
  console.log("fetchHires", userAddress);

  const query = gql`
    query GetJobs($client: String!) {
      jobs(where: { client: $client }, orderBy: "acceptedAt", orderDirection: "desc") {
        items {
          jobId
          postingId
          client
          freelancer
          payment
          title
          description
          category
          bannerImageHash
          jobDuration
          deadline
          state
          createdAt
          acceptedAt
          clientReceived
          freelancerDelivered
        }
      }
    }
  `;

  const res = await request<{ jobs: { items: Job[] } }>(endpoint, query, { client: userAddress });
  return { jobs: res.jobs.items };
};
