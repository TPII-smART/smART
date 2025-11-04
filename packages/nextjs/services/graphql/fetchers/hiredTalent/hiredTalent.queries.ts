import { gql } from "graphql-request";

export const maxPayment = gql`
  query GetTalentsPayments {
    talents(orderBy: "basePayment", limit: 1, orderDirection: "desc") {
      items {
        basePayment
      }
    }
  }
`;

export const getTalents = gql`
  query GetTalents {
    talents(orderBy: "createdAt", orderDirection: "desc") {
      items {
        talentId
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

export const getTalentsPaginated = gql`
  query GetTalents(
    $limit: Int!
    $startCursor: String
    $endCursor: String
    $search: String!
    $orderBy: String!
    $orderDirection: String!
    $minPrice: BigInt
    $maxPrice: BigInt
    $categories: [String]
    $userAddresses: [String]
  ) {
    talents(
      limit: $limit
      after: $endCursor
      before: $startCursor
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: {
        AND: [
          { OR: [{ title_contains: $search }, { description_contains: $search }, { freelancer_in: $userAddresses }] }
          { basePayment_gte: $minPrice, basePayment_lte: $maxPrice, category_in: $categories }
        ]
      }
    ) {
      items {
        talentId
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

export const getMyTalents = gql`
  query GetTalents($userAddress: String!) {
    talents(where: { freelancer: $userAddress }, orderBy: "createdAt", orderDirection: "desc") {
      items {
        talentId
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

export const getMyTalentsPaginated = gql`
  query GetMyTalentsPaginated($userAddress: String!, $limit: Int!, $startCursor: String, $endCursor: String) {
    talents(
      limit: $limit
      after: $endCursor
      before: $startCursor
      where: { freelancer: $userAddress }
      orderBy: "createdAt"
      orderDirection: "desc"
    ) {
      items {
        talentId
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

export const getRatingsByTalentIds = gql`
  query GetRatingsByTalentIds($talentIds: [BigInt!]!) {
    hiredTalents(where: { talentId_in: $talentIds }) {
      items {
        hiredTalentId
        talentId
        rating
      }
    }
  }
`;

export const getMyHiredTalentRatings = gql`
  query GetMyHiredTalentRatings($userAddress: String!) {
    hiredTalents(where: { freelancer: $userAddress }) {
      items {
        hiredTalentId
        talentId
        rating
      }
    }
  }
`;

export const getHiredTalentsFromTalent = gql`
  query GetHiredTalents($talentId: BigInt!) {
    hiredTalents(where: { talentId: $talentId }, orderBy: "acceptedAt", orderDirection: "desc") {
      items {
        hiredTalentId
        talentId
        client
        freelancer
        payment
        title
        description
        category
        bannerImageHash
        hiredTalentDuration
        deadline
        state
        rating
        createdAt
        acceptedAt
        finishedAt
        canceledAt
        rejectedAt
        clientReceived
        freelancerDelivered
        clientRejected
        clientCancelled
        freelancerCancelled
        disputeId
      }
    }
  }
`;

export const getHiredTalentsFromTalentPaginated = gql`
  query GetHiredTalentsFromTalentPaginated(
    $talentId: BigInt!
    $limit: Int!
    $startCursor: String
    $endCursor: String
    $search: String
    $state: Int
  ) {
    hiredTalents(
      limit: $limit
      after: $endCursor
      before: $startCursor
      where: { talentId: $talentId, state: $state, title_contains: $search }
      orderBy: "acceptedAt"
      orderDirection: "desc"
    ) {
      items {
        hiredTalentId
        talentId
        client
        freelancer
        payment
        title
        description
        category
        bannerImageHash
        hiredTalentDuration
        deadline
        state
        rating
        createdAt
        acceptedAt
        finishedAt
        canceledAt
        rejectedAt
        clientReceived
        freelancerDelivered
        clientRejected
        clientCancelled
        freelancerCancelled
        disputeId
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

export const getTalentRatings = gql`
  query GetTalentRatings($talentId: BigInt!) {
    hiredTalents(where: { talentId: $talentId, rating_gt: 0 }) {
      items {
        rating
      }
    }
  }
`;

export const getTalentById = gql`
  query GetTalent($talentId: BigInt!) {
    talent(talentId: $talentId) {
      talentId
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
`;

export const getMyHiredTalents = gql`
  query GetHiredTalents($freelancer: String!) {
    hiredTalents(where: { freelancer: $freelancer }, orderBy: "acceptedAt", orderDirection: "desc") {
      items {
        hiredTalentId
        talentId
        client
        freelancer
        payment
        title
        description
        category
        hiredTalentDuration
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
        disputeId
      }
    }
  }
`;

export const getHires = gql`
  query GetHiredTalents($client: String!) {
    hiredTalents(where: { client: $client }, orderBy: "acceptedAt", orderDirection: "desc") {
      items {
        hiredTalentId
        talentId
        client
        freelancer
        payment
        title
        description
        category
        bannerImageHash
        hiredTalentDuration
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
        clientCancelled
        freelancerCancelled
        disputeId
      }
    }
  }
`;

export const getHiresPaginated = gql`
  query GetHiresPaginated($client: String!, $limit: Int!, $startCursor: String, $endCursor: String) {
    hiredTalents(
      limit: $limit
      after: $endCursor
      before: $startCursor
      where: { client: $client }
      orderBy: "acceptedAt"
      orderDirection: "desc"
    ) {
      items {
        hiredTalentId
        talentId
        client
        freelancer
        payment
        title
        description
        category
        bannerImageHash
        hiredTalentDuration
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
        clientCancelled
        freelancerCancelled
        disputeId
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

export const getHiredTalentAndHires = gql`
  query GetHiredTalents($address: String!) {
    hiredTalents(
      where: { OR: [{ freelancer: $address }, { client: $address }] }
      orderBy: "acceptedAt"
      orderDirection: "desc"
    ) {
      items {
        hiredTalentId
        talentId
        client
        freelancer
        payment
        title
        description
        category
        bannerImageHash
        hiredTalentDuration
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
        disputeId
      }
    }
  }
`;

export const getHiredTalentAndHiresPaginated = gql`
  query GetHiredTalentsPaginated($address: String!, $limit: Int!, $startCursor: String, $endCursor: String) {
    hiredTalents(
      limit: $limit
      after: $endCursor
      before: $startCursor
      where: { OR: [{ freelancer: $address }, { client: $address }] }
      orderBy: "acceptedAt"
      orderDirection: "desc"
    ) {
      items {
        hiredTalentId
        talentId
        client
        freelancer
        payment
        title
        description
        category
        bannerImageHash
        hiredTalentDuration
        deadline
        state
        createdAt
        acceptedAt
        finishedAt
        canceledAt
        disputedAt
        deliveredAt
        emitBy
        clientReceived
        freelancerDelivered
        disputeId
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

export const getDeliverablesForHiredTalent = gql`
  query GetDeliverablesForHiredTalent($hiredTalentId: BigInt!, $talentId: BigInt!) {
    hiredTalentDeliverables(
      where: { hiredTalentId: $hiredTalentId, talentId: $talentId }
      orderBy: "uploadedAt"
      orderDirection: "desc"
    ) {
      items {
        resource
        uploadedAt
        state
        submissionComment
        clientResponse
        responseTimestamp
        lastTransactionHash
      }
    }
  }
`;

export const getHiredTalent = gql`
  query GetHiredTalent($hiredTalentId: BigInt!, $talentId: BigInt!) {
    hiredTalent(hiredTalentId: $hiredTalentId, talentId: $talentId) {
      hiredTalentId
      talentId
      client
      freelancer
      payment
      title
      description
      category
      bannerImageHash
      hiredTalentDuration
      deadline
      state
      createdAt
      acceptedAt
      finishedAt
      canceledAt
      clientRejected
      clientReceived
      freelancerDelivered
      disputeId
      freelancerUploaded
      rating
      lastTransactionHash
    }
  }
`;
