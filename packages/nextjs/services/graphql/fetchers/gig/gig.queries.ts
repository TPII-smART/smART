import { gql } from "graphql-request";

export const maxPayment = gql`
  query GetGigPayments {
    gigs {
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
