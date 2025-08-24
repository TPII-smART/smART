import { gql } from "graphql-request";

export const maxPayment = gql`
  query GetGigPayments {
    gigs(orderBy: "basePayment", limit: 1, orderDirection: "desc") {
      items {
        basePayment
      }
    }
  }
`;

export const getGigs = gql`
  query GetGigs {
    gigs(orderBy: "createdAt", orderDirection: "desc") {
      items {
        gigId
        client
        acceptedFreelancer
        basePayment
        finalPayment
        title
        description
        category
        maxDurationInHours
        finalDurationInHours
        deadline
        createdAt
        acceptedAt
        finishedAt
        canceledAt
        state
        clientReceived
        freelancerDelivered
        acceptedApplicationId
        gigBannerImageHash
      }
    }
  }
`;

export const getGigsPaginated = gql`
  query GetGigsPaginated(
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
    gigs(
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
        gigId
        client
        acceptedFreelancer
        basePayment
        finalPayment
        title
        description
        category
        maxDurationInHours
        finalDurationInHours
        deadline
        createdAt
        acceptedAt
        finishedAt
        canceledAt
        state
        clientReceived
        freelancerDelivered
        acceptedApplicationId
        gigBannerImageHash
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

export const getMyGigs = gql`
  query GetMyGigs($userAddress: String!) {
    gigs(where: { client: $userAddress }) {
      items {
        gigId
        client
        acceptedFreelancer
        basePayment
        finalPayment
        title
        description
        category
        maxDurationInHours
        finalDurationInHours
        deadline
        createdAt
        acceptedAt
        finishedAt
        canceledAt
        state
        clientReceived
        freelancerDelivered
        acceptedApplicationId
        gigBannerImageHash
        emitBy
      }
    }
  }
`;

export const getMyApplications = gql`
  query GetMyApplications($userAddress: String!) {
    gigApplications(where: { freelancer: $userAddress }) {
      items {
        applicationId
        gigId
        freelancer
        proposedPayment
        proposedDurationInHours
        state
        createdAt
        proposalComment
        rejectionComment
        emitBy
        rejectAt
      }
    }
  }
`;

export const getGigByIds = gql`
  query GetGigsByIds($gigIds: [BigInt!]!) {
    gigs(where: { gigId_in: $gigIds }) {
      items {
        gigId
        client
        acceptedFreelancer
        basePayment
        finalPayment
        title
        description
        category
        maxDurationInHours
        finalDurationInHours
        deadline
        createdAt
        acceptedAt
        finishedAt
        canceledAt
        deliveredAt
        emitBy
        state
        clientReceived
        freelancerDelivered
        acceptedApplicationId
        gigBannerImageHash
      }
    }
  }
`;

export const getApplicationsForGig = gql`
  query GetApplicationsForGig($gigId: BigInt!) {
    gigApplications(where: { gigId: $gigId }) {
      items {
        applicationId
        gigId
        freelancer
        proposedPayment
        proposedDurationInHours
        state
        createdAt
        proposalComment
        rejectionComment
      }
    }
  }
`;

export const getApplicationsForGigs = gql`
  query GetApplicationsForGigs($gigIds: [BigInt!]!) {
    gigApplications(where: { gigId_in: $gigIds }) {
      items {
        applicationId
        gigId
        freelancer
        proposedPayment
        proposedDurationInHours
        state
        createdAt
        proposalComment
        rejectionComment
        emitBy
        rejectAt
      }
    }
  }
`;

export const getGigById = gql`
  query GetGigById($gigId: BigInt!) {
    gig(gigId: $gigId) {
      gigId
      client
      acceptedFreelancer
      basePayment
      finalPayment
      title
      description
      category
      maxDurationInHours
      finalDurationInHours
      deadline
      createdAt
      acceptedAt
      finishedAt
      canceledAt
      state
      clientReceived
      freelancerDelivered
      acceptedApplicationId
      gigBannerImageHash
    }
  }
`;
