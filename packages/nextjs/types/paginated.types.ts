export interface Paginated<T> {
  data: T[];
  meta: PaginationMetadata;
}

export interface PaginationMetadata {
  totalCount: number;
  endCursor: string | null;
  startCursor: string | null;
  hasNextPage: boolean;
  // hasPreviousPage: boolean;
}

export interface PaginationQueryResponse<T> {
  items: T[];
  pageInfo: Omit<PaginationMetadata, "totalCount">;
  totalCount: number;
}

export type PaginationMetaArg = Partial<Pick<PaginationMetadata, "endCursor" | "startCursor">> & {
  limit: number;
  key?: string;
};

export type SearchParams = any | undefined;
