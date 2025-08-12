import { endpoint } from "../config";
import request, { gql } from "graphql-request";
import { Application, Gig } from "~~/types/gig.types";

export const fetchMaxGigPayment = async () => {
  const query = gql`
    query GetGigPayments {
      gigs {
        items {
          basePayment
        }
      }
    }
  `;

  const res = await request<{ gigs: { items: Gig[] } }>(endpoint, query);
  const payments = res.gigs.items.map(item => Number(item.basePayment) || 0);
  const max = payments.length > 0 ? Math.max(...payments) : 0;
  return max / 1e18; // Convert wei to ether
};

export const fetchGigs = async () => {
  const query = gql`
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

  const res = await request<{ gigs: { items: Gig[] } }>(endpoint, query);
  return { gigs: res.gigs.items };
};

export const fetchMyGigs = async (userAddress: string) => {
  const query = gql`
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

  const res = await request<{ gigs: { items: Gig[] } }>(endpoint, query, { userAddress: userAddress });
  return { gigs: res.gigs.items };
};

export const fetchApplications = async (userAddress: string) => {
  const query = gql`
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
  const res = await request<{ gigApplications: { items: Application[] } }>(endpoint, query, {
    userAddress: userAddress,
  });
  return { applications: res.gigApplications.items };
};

export const fetchApplicationsWithGigDetails = async (userAddress: string) => {
  const queryApplications = gql`
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
  const res = await request<{ gigApplications: { items: Application[] } }>(endpoint, queryApplications, {
    userAddress: userAddress,
  });
  const gigIds = res.gigApplications.items.map(app => app.gigId);
  const uniqueGigIds = Array.from(new Set(gigIds));

  // Convert gigIds to strings for GraphQL query (BigInt values need to be sent as strings)
  const stringGigIds = uniqueGigIds.map(id => id.toString());

  const queryGigs = gql`
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
  const resGigs = await request<{ gigs: { items: Gig[] } }>(endpoint, queryGigs, {
    gigIds: stringGigIds,
  });
  const gigsMap = new Map(resGigs.gigs.items.map(gig => [gig.gigId, gig]));
  const applicationsWithGigDetails = res.gigApplications.items.map(app => ({
    ...app,
    gig: gigsMap.get(app.gigId),
  }));
  return { applications: applicationsWithGigDetails };
};

export const fetchApplicationsForGig = async (gigId: string) => {
  console.log("fetchApplicationsForGig", gigId);
  const query = gql`
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
  const res = await request<{ gigApplications: { items: Application[] } }>(endpoint, query, {
    gigId: gigId,
  });
  return { applications: res.gigApplications.items };
};

export const fetchGigById = async (gigId: string) => {
  const query = gql`
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
  const res = await request<{ gig: Gig }>(endpoint, query, { gigId: gigId });
  return res.gig;
};
