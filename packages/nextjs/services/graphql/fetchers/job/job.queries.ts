import { gql } from "graphql-request";

export const maxPayment = gql`
  query GetJobPostingsPayments {
    jobPostings {
      items {
        basePayment
      }
    }
  }
`;

export const getJobPostings = gql`
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

export const getJobPostingsPaginated = gql`
  query GetJobPostings(
    $search: String!
    $orderBy: String!
    $orderDirection: String!
    $minPrice: BigInt
    $maxPrice: BigInt
  ) {
    jobPostings(
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: {
        AND: [
          { OR: [{ title_contains: $search }, { description_contains: $search }] }
          { basePayment_gte: $minPrice, basePayment_lte: $maxPrice }
        ]
      }
    ) {
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
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

export const getMyJobPostings = gql`
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

export const getJobsFromPosting = gql`
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

export const getMyJobs = gql`
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

export const getHires = gql`
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
