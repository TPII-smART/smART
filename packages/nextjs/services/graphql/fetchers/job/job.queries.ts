import { gql } from "graphql-request";

export const maxPayment = gql`
  query GetJobPostingsPayments {
    jobPostings(orderBy: "basePayment", limit: 1, orderDirection: "desc") {
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
    $limit: Int!
    $startCursor: String
    $endCursor: String
    $search: String!
    $orderBy: String!
    $orderDirection: String!
    $minPrice: BigInt
    $maxPrice: BigInt
    $categories: [String]
  ) {
    jobPostings(
      limit: $limit
      after: $endCursor
      before: $startCursor
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: {
        AND: [
          { OR: [{ title_contains: $search }, { description_contains: $search }] }
          { basePayment_gte: $minPrice, basePayment_lte: $maxPrice, category_in: $categories }
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
        startCursor
        hasPreviousPage
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

export const getRatingsByPostingIds = gql`
  query GetRatingsByPostingIds($postingIds: [BigInt!]!) {
    jobs(where: { postingId_in: $postingIds }) {
      items {
        jobId
        postingId
        rating
      }
    }
  }
`;

export const getMyJobRatings = gql`
  query GetMyJobRatings($userAddress: String!) {
    jobs(where: { freelancer: $userAddress }) {
      items {
        jobId
        postingId
        rating
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
        deliveredAt
        emitBy
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
        uploadedAt
        finishedAt
        canceledAt
        deliveredAt
        emitBy
        clientReceived
        freelancerDelivered
        submissionComment
        resource
        isLink
      }
    }
  }
`;

export const getJobAndHires = gql`
  query GetJobs($address: String!) {
    jobs(
      where: { OR: [{ freelancer: $address }, { client: $address }] }
      orderBy: "acceptedAt"
      orderDirection: "desc"
    ) {
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
        deliveredAt
        emitBy
        clientReceived
        freelancerDelivered
      }
    }
  }
`;

export const getJobAndHiresPaginated = gql`
  query GetJobsPaginated($address: String!, $limit: Int!, $startCursor: String, $endCursor: String) {
    jobs(
      limit: $limit
      after: $endCursor
      before: $startCursor
      where: { OR: [{ freelancer: $address }, { client: $address }] }
      orderBy: "acceptedAt"
      orderDirection: "desc"
    ) {
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
        deliveredAt
        emitBy
        clientReceived
        freelancerDelivered
      }
      pageInfo {
        endCursor
        hasNextPage
        startCursor
        hasPreviousPage
      }
      totalCount
    }
  }
`;
