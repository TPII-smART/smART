export interface Paginated<T> {
  data: T[];
  meta: PaginationMetadata;
}

export interface PaginationMetadata {
  totalCount: number;
  endCursor: string;
  hasNextPage: boolean;
}

export interface PaginationQueryResponse<T> {
  items: T[];
  pageInfo: { endCursor: string; hasNextPage: boolean };
  totalCount: number;
}

export type SearchParams = any | undefined;
