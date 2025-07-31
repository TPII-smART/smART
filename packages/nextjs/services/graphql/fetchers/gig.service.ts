import { endpoint } from "../config";
import request, { gql } from "graphql-request";
import { Gig } from "~~/types/gig.types";

export const fetchMaxGigPayment = async () => {
  const query = gql`
    query GetGigPayments {
      gigs {
        items {
          maxPayment
        }
      }
    }
  `;

  const res = await request<{ gigs: { items: Gig[] } }>(endpoint, query);
  const payments = res.gigs.items.map(item => Number(item.maxPayment) || 0);
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
          maxPayment
          finalPayment
          title
          description
          category
          maxDurationInHours
          finalDurationInHours
          deadline
          createdAt
          acceptedAt
          state
          clientReceived
          freelancerDelivered
          acceptedApplicationId
        }
      }
    }
  `;

  const res = await request<{ gigs: { items: Gig[] } }>(endpoint, query);
  return { gigs: res.gigs.items };
};
