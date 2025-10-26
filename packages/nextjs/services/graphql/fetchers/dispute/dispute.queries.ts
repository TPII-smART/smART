import { gql } from "graphql-request";

// Query principal que trae disputes CON contributors
export const getDisputesWithContributors = gql`
  query GetDisputesWithContributors {
    disputes(orderBy: "disputeId", orderDirection: "desc") {
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

export const getDisputes = gql`
  query GetDisputes {
    disputes(orderBy: "disputeId", orderDirection: "desc") {
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

export const getDisputeByIdWithContributors = gql`
  query GetDisputeByIdWithContributors($disputeId: BigInt!) {
    dispute(where: { disputeId: $disputeId }) {
      disputeId
      raiseOnKleros
      klerosDisputeId
      title
      description
      disputeReason
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
    disputeContributors(where: { disputeId: $disputeId }) {
      items {
        contributor
      }
    }
  }
`;

export const getDisputeById = gql`
  query GetDisputeById($disputeId: BigInt!) {
    dispute(where: { disputeId: $disputeId }) {
      disputeId
      raiseOnKleros
      klerosDisputeId
      title
      description
      disputeReason
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
`;

export const getAppelableDisputes = gql`
  query GetAppelableDisputes {
    disputes(where: { status: 1 }) {
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
    }
  }
`;

export const getAppelabeDisputeByParticipantId = gql`
  query GetAppelabeDisputeByParticipantId($participantId: BigInt!) {
    disputes(where: { status: 1, OR: [{ freelancerId: $participantId }, { clientId: $participantId }] }) {
      items {
        disputeId
        klerosDisputeId
        title
        description
        disputeReason
        raiseOnKleros
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

// Paginated appelable disputes
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

// Paginated: obtener disputeIds donde contribuyó un usuario (paginado)
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

export const getDisputesContributedByUser = gql`
  query GetDisputesContributedByUser($contributor: String!) {
    disputeContributors(where: { contributor: $contributor }) {
      items {
        disputeId
      }
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

export const getContributorsByDisputeId = gql`
  query GetContributorsByDisputeId($disputeId: BigInt!) {
    disputeContributors(where: { disputeId: $disputeId }) {
      items {
        contributor
      }
    }
  }
`;

// Query batch para obtener contributors de múltiples disputes de una vez
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
