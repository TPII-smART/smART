import { endpoint } from "../config";
import request, { gql } from "graphql-request";
import { Job } from "~~/types/job.types";

export const fetchMaxPayment = async () => {
  const query = gql`
    query GetJobsPayments {
      jobs {
        items {
          payment
        }
      }
    }
  `;

  const res = await request<{ jobs: { items: Job[] } }>(endpoint, query);
  const payments = res.jobs.items.map(item => Number(item.payment) || 0);
  const max = payments.length > 0 ? Math.max(...payments) : 0;
  return max / 1e18; // Convert wei to ether
};

export const fetchJobs = async () => {
  const query = gql`
    query GetJobs {
      jobs(orderBy: "createdAt", orderDirection: "desc") {
        items {
          jobId
          freelancer
          client
          payment
          title
          description
          category
          estimatedDuration
          createdAt
          acceptedAt
          deadline
          completedAt
          cancelledAt
        }
      }
    }
  `;

  const res = await request<{ jobs: { items: Job[] } }>(endpoint, query);
  // Only keep jobs that have no client (i.e., not hired yet)
  const no_client_jobs = res.jobs.items.filter(job => !job.client);
  return { jobs: no_client_jobs };
};

export const fetchMyJobs = async (userAddress: string) => {
  console.log("fetchMyJobs", userAddress);

  const query = gql`
    query GetJobs($freelancer: String!) {
      jobs(where: { freelancer: $freelancer }, orderBy: "acceptedAt", orderDirection: "desc") {
        items {
          jobId
          freelancer
          client
          payment
          title
          description
          category
          estimatedDuration
          createdAt
          acceptedAt
          deadline
          completedAt
          cancelledAt
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
          freelancer
          client
          payment
          title
          description
          category
          estimatedDuration
          createdAt
          acceptedAt
          deadline
          completedAt
          cancelledAt
        }
      }
    }
  `;

  const res = await request<{ jobs: { items: Job[] } }>(endpoint, query, { client: userAddress });
  return { jobs: res.jobs.items };
};
