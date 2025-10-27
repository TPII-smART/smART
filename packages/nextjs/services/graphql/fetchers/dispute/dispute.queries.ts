import { gql } from "graphql-request";

export const getAppelableDisputesPaginated = gql`
  query GetAppelableDisputesPaginated(
    $limit: Int!
    $startCursor: String
    $endCursor: String
    $orderBy: String
    $orderDirection: String
    $now: BigInt!
  ) {
    disputes(
      where: { AND: [{ status: 1 }, { disputeFinished: false }, { roundDeadline_gt: $now }, { isAppealed: true }] }
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
    disputes(
      where: { AND: [{ status: 1 }, { disputeId_in: $ids }, { disputeFinished: false }, { isAppealed: true }] }
      orderBy: "disputeId"
      orderDirection: "desc"
    ) {
      items {
        disputeId
        klerosDisputeId
        type
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

export const getTalentIdByDisputeId = gql`
  query GetTalentIdByDisputeId($disputeId: BigInt!) {
    hiredTalents(where: { disputeId: $disputeId }) {
      items {
        talentId
        hiredTalentId
      }
    }
  }
`;

export const getGigIdByDisputeId = gql`
  query GetGigIdByDisputeId($disputeId: BigInt!) {
    gigs(where: { disputeId: $disputeId }) {
      items {
        gigId
      }
    }
  }
`;
