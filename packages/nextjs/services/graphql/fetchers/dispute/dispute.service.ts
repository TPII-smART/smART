import { endpoint } from "../../config";
import * as DisputesQueries from "./dispute.queries";
import request from "graphql-request";
import { Dispute } from "~~/types/dispute";
import { Paginated, PaginationMetaArg, PaginationQueryResponse } from "~~/types/paginated.types";

// Tipo extendido con contributors
export interface DisputeWithContributors extends Dispute {
  contributors: string[];
}

// Tipo para la respuesta de contributors
interface DisputeContributor {
  disputeId: string;
  contributor: string;
}

/**
 * Obtiene todas las disputes con sus contributors
 * Hace 2 queries: una para disputes y otra para todos los contributors
 */
export const fetchDisputesWithContributors = async (): Promise<DisputeWithContributors[]> => {
  // 1. Obtener todas las disputes
  const disputesResponse = await request<{
    disputes: PaginationQueryResponse<Dispute>;
  }>(endpoint, DisputesQueries.getAppelableDisputes);

  const disputes = disputesResponse.disputes.items;

  if (disputes.length === 0) {
    return [];
  }

  // 2. Obtener todos los disputeIds
  const disputeIds = disputes.map(d => d.disputeId);

  // 3. Obtener todos los contributors en una sola query
  const contributorsResponse = await request<{
    disputeContributors: PaginationQueryResponse<DisputeContributor>;
  }>(endpoint, DisputesQueries.getContributorsByDisputeIds, { disputeIds });

  // 4. Agrupar contributors por disputeId
  const contributorsByDispute = contributorsResponse.disputeContributors.items.reduce(
    (acc, item) => {
      const disputeId = item.disputeId.toString();
      if (!acc[disputeId]) {
        acc[disputeId] = [];
      }
      acc[disputeId].push(item.contributor);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  // 5. Combinar disputes con contributors
  return disputes.map(dispute => ({
    ...dispute,
    contributors: contributorsByDispute[dispute.disputeId.toString()] || [],
  }));
};

/**
 * Obtiene una dispute específica con sus contributors
 */
export const fetchDisputeByIdWithContributors = async (disputeId: bigint): Promise<DisputeWithContributors | null> => {
  const response = await request<{
    dispute: Dispute | null;
    disputeContributors: PaginationQueryResponse<{ contributor: string }>;
  }>(endpoint, DisputesQueries.getDisputeByIdWithContributors, { disputeId });

  if (!response.dispute) {
    return null;
  }

  return {
    ...response.dispute,
    contributors: response.disputeContributors.items.map(c => c.contributor),
  };
};

/**
 * Obtiene disputes apelables (mantiene compatibilidad)
 */
export const fetchAppelableDisputes = async (): Promise<Dispute[]> => {
  const response = await request<{
    disputes: PaginationQueryResponse<Dispute>;
  }>(endpoint, DisputesQueries.getAppelableDisputes);
  return response.disputes.items;
};

/**
 * Obtiene disputes apelables CON contributors
 */
export const fetchAppelableDisputesWithContributors = async (): Promise<DisputeWithContributors[]> => {
  const disputes = await fetchAppelableDisputes();

  if (disputes.length === 0) {
    return [];
  }

  const disputeIds = disputes.map(d => d.disputeId);

  const contributorsResponse = await request<{
    disputeContributors: PaginationQueryResponse<DisputeContributor>;
  }>(endpoint, DisputesQueries.getContributorsByDisputeIds, { disputeIds });

  const contributorsByDispute = contributorsResponse.disputeContributors.items.reduce(
    (acc, item) => {
      const disputeId = item.disputeId.toString();
      if (!acc[disputeId]) {
        acc[disputeId] = [];
      }
      acc[disputeId].push(item.contributor);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return disputes.map(dispute => ({
    ...dispute,
    contributors: contributorsByDispute[dispute.disputeId.toString()] || [],
  }));
};

/**
 * Obtiene IDs de disputes en las que un usuario ha contribuido
 */
export const fetchDisputesIdsContributedByUser = async (contributor: string): Promise<bigint[]> => {
  const response = await request<{
    disputeContributors: PaginationQueryResponse<{ disputeId: bigint }>;
  }>(endpoint, DisputesQueries.getDisputesContributedByUser, { contributor });

  return response.disputeContributors.items.map(item => item.disputeId);
};

/**
 * Obtiene disputes por IDs
 */
export const fetchDisputesByIds = async (disputeIds: bigint[]): Promise<Dispute[]> => {
  if (disputeIds.length === 0) {
    return [];
  }

  const response = await request<{
    disputes: PaginationQueryResponse<Dispute>;
  }>(endpoint, DisputesQueries.getDisputesByIds, { ids: disputeIds });

  return response.disputes.items;
};

/**
 * Obtiene disputes en las que un usuario ha contribuido CON sus contributors
 */
export const fetchDisputesContributedByUser = async (contributor: string): Promise<DisputeWithContributors[]> => {
  const disputeIds = await fetchDisputesIdsContributedByUser(contributor);

  if (disputeIds.length === 0) {
    return [];
  }

  const disputes = await fetchDisputesByIds(disputeIds);

  // Obtener contributors para estas disputes
  const contributorsResponse = await request<{
    disputeContributors: PaginationQueryResponse<DisputeContributor>;
  }>(endpoint, DisputesQueries.getContributorsByDisputeIds, {
    disputeIds,
  });

  const contributorsByDispute = contributorsResponse.disputeContributors.items.reduce(
    (acc, item) => {
      const disputeId = item.disputeId.toString();
      if (!acc[disputeId]) {
        acc[disputeId] = [];
      }
      acc[disputeId].push(item.contributor);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return disputes.map(dispute => ({
    ...dispute,
    contributors: contributorsByDispute[dispute.disputeId.toString()] || [],
  }));
};

/**
 * Obtiene contributors de una dispute específica
 */
export const fetchContributorsByDisputeId = async (disputeId: bigint): Promise<string[]> => {
  const response = await request<{
    disputeContributors: PaginationQueryResponse<{ contributor: string }>;
  }>(endpoint, DisputesQueries.getContributorsByDisputeId, { disputeId });

  return response.disputeContributors.items.map(item => item.contributor);
};
