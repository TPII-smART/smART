import { gql } from "graphql-request";

export const getAppelableDisputesPaginated = gql`
  query GetAppelableDisputesPaginated(
    $limit: Int!
    $startCursor: String
    $endCursor: String
    $orderBy: String
    $orderDirection: String
  ) {
    disputes(
      where: { status: 1 }
      limit: $limit
      before: $startCursor
      after: $endCursor
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      items {
        disputeId
        raiseOnKleros
        type
        title
        description
        disputeReason
        klerosDisputeId
        roundDeadline
        currentRound
        currentRuling
        freelancerFunds
        clientFunds
        freelancerFee
        clientFee
        appealCost
        status
        disputeFinished
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

export const getDisputesContributedByUserPaginated = gql`
  query GetDisputesContributedByUserPaginated(
    $contributor: String!
    $limit: Int!
    $startCursor: String
    $endCursor: String
  ) {
    disputeContributors(where: { contributor: $contributor }, limit: $limit, before: $startCursor, after: $endCursor) {
      items {
        disputeId
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;
export const getDisputesByIds = gql`
  query GetDisputesByIds($ids: [BigInt!]!) {
    disputes(where: { disputeId_in: $ids }, orderBy: "disputeId", orderDirection: "desc") {
      items {
        disputeId
        klerosDisputeId
        title
        description
        disputeReason
        raiseOnKleros
        freelancerPaidArbitrationFee
        clientPaidArbitrationFee
        roundDeadline
        currentRound
        currentRuling
        freelancerFunds
        clientFunds
        freelancerFee
        clientFee
        appealCost
        status
        disputeFinished
      }
    }
  }
`;

export const getContributorsByDisputeIds = gql`
  query GetContributorsByDisputeIds($disputeIds: [BigInt!]!) {
    disputeContributors(where: { disputeId_in: $disputeIds }) {
      items {
        disputeId
        contributor
      }
    }
  }
`;
