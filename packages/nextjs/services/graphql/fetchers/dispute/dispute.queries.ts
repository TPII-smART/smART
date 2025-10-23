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
        disputeDeadline
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
        disputeDeadline
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
      disputeDeadline
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
      disputeDeadline
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
        title
        description
        disputeReason
        klerosDisputeId
        disputeDeadline
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
        disputeDeadline
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
        disputeDeadline
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
