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
    gigs(orderBy: "createdAt", orderDirection: "desc", where: { state: 0 }) {
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
        rating
        acceptedApplicationId
        gigBannerImageHash
        disputeQuestionId
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
    $minPayment: BigInt
    $maxPayment: BigInt
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
          { basePayment_gte: $minPayment, basePayment_lte: $maxPayment, category_in: $categories }
          { state: 0 }
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
        rating
        acceptedApplicationId
        gigBannerImageHash
        disputeQuestionId
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
        rating
        acceptedApplicationId
        gigBannerImageHash
        emitBy
        disputeQuestionId
      }
    }
  }
`;

export const getMyGigsPaginated = gql`
  query GetMyGigsPaginated($userAddress: String!, $limit: Int!, $startCursor: String, $endCursor: String) {
    gigs(
      where: { client: $userAddress }
      limit: $limit
      after: $endCursor
      before: $startCursor
      orderDirection: "desc"
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
        emitBy
        disputeQuestionId
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

export const getMyApplicationsPaginated = gql`
  query GetMyApplicationsPaginated($userAddress: String!, $limit: Int!, $startCursor: String, $endCursor: String) {
    gigApplications(
      where: { freelancer: $userAddress }
      limit: $limit
      after: $endCursor
      before: $startCursor
      orderDirection: "desc"
    ) {
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
        rating
        acceptedApplicationId
        gigBannerImageHash
        disputeQuestionId
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
      deliveredAt
      rejectedAt
      state
      clientReceived
      freelancerDelivered
      clientCancelled
      freelancerCancelled
      clientRejected
      rating
      acceptedApplicationId
      gigBannerImageHash
      disputeQuestionId
    }
  }
`;

export const getMyGigRatings = gql`
  query GetMyGigRatings($userAddress: String!) {
    gigs(where: { acceptedFreelancer: $userAddress }) {
      items {
        gigId
        rating
      }
    }
  }
`;

export const getDeliverablesForGig = gql`
  query GetDeliverablesForGig($gigId: BigInt!) {
    gigDeliverables(where: { gigId: $gigId }) {
      items {
        gigId
        resource
        submissionComment
        clientResponse
        isLink
        uploadedAt
      }
    }
  }
`;
