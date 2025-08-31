import { useCallback, useRef, useState } from "react";
import { Paginated, PaginationMetaArg, PaginationMetadata, SearchParams } from "~~/types/paginated.types";

export type PaginationScrollEvent = {
  currentTarget?: {
    scrollTop: number;
    clientHeight: number;
    scrollHeight: number;
  };
  target?: {
    scrollTop: number;
    clientHeight: number;
    scrollHeight: number;
  };
};

type MetadataCache<T> = {
  [key: string]: {
    data: T[];
    meta: PaginationMetadata;
  };
};

const compareParams = (a: SearchParams[], b: SearchParams[]) => {
  if (a.length !== b.length) return false;
  return a.every((param, index) => param === b[index]);
};

export interface PaginationHookParams<T> {
  fetchFunction: (meta: PaginationMetaArg, ...any: SearchParams[]) => Promise<Paginated<T>>;
  loadingFunction: (value: boolean, key?: string) => void;
  setDataFunction: (data: T[], key?: string) => void;
  itemsPerPage?: number;
}

const setCacheMetaData = <T>(key: string, meta: PaginationMetadata, cache: MetadataCache<T>) => {
  if (!cache[key]) {
    cache[key] = { meta, data: [] };
    return cache;
  }

  cache[key].meta.endCursor = meta.endCursor;
  cache[key].meta.hasNextPage = meta.hasNextPage;
  if (cache[key].meta.startCursor === undefined) {
    cache[key].meta.startCursor = meta.startCursor;
  }

  return cache;
};

export const usePagination = <T>({
  fetchFunction,
  loadingFunction,
  setDataFunction,
  itemsPerPage = 20,
}: PaginationHookParams<T>) => {
  // states
  const [totalItems, setTotalItems] = useState<{ [key: string]: number }>({});
  // refs
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSearch = useRef<SearchParams[]>([]);
  const cache = useRef<MetadataCache<T>>({});
  const lastScrollTop = useRef<number>(0);
  const loading = useRef<{ [key: string]: boolean }>({});

  const setData = useCallback(
    (cache: MetadataCache<T>, key: string, data: T[]) => {
      const pushedData: T[] = cache[key].data.length === 0 ? data : cache[key].data.concat(data);

      setDataFunction(pushedData, key);
      cache[key].data = pushedData;
      return cache;
    },
    [setDataFunction],
  );

  const setLoading = useCallback(
    (value: boolean, key: string) => {
      if (typeof loading.current !== "object" || loading.current === null) {
        loading.current = {};
      }
      loading.current[key] = value;
      loadingFunction(value, key);
    },
    [loadingFunction, loading],
  );

  const fetchData = useCallback(
    async (hasParamNotChanged: boolean, key: string, ...params: SearchParams[]): Promise<void> => {
      if (!hasParamNotChanged) {
        // If search params changed, reinitialize cache
        delete cache.current[key];
      }

      if (cache.current[key]?.meta?.hasNextPage === false) {
        cache.current = setData(cache.current, key, []);
        return;
      }

      if (loading.current[key]) {
        return;
      }

      setLoading(true, key);

      const response: Paginated<T> = await fetchFunction(
        { limit: itemsPerPage, endCursor: cache.current[key]?.meta?.endCursor, key },
        ...params,
      );
      setTotalItems(prev => ({ ...prev, [key]: response.meta?.totalCount || itemsPerPage }));
      cache.current = setCacheMetaData(key, response.meta, cache.current);
      cache.current = setData(cache.current, key, response.data);

      setTimeout(() => {
        setLoading(false, key);
      }, 100);
      lastSearch.current = params ?? [];
    },
    [lastSearch, setData, cache, fetchFunction, itemsPerPage, setLoading],
  );

  const fetchPaginatedData = useCallback(
    async (instantFetch: boolean, key: string, ...searchParams: SearchParams[]) => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

      const hasParamNotChanged = compareParams(lastSearch.current, searchParams);

      if (hasParamNotChanged || instantFetch) {
        // If search params have not changed, fetch data immediately
        await fetchData(hasParamNotChanged, key, ...searchParams);
      } else {
        // If search params have changed, debounce the fetch
        // This is used to avoid user request spam
        debounceTimeout.current = setTimeout(async () => {
          await fetchData(hasParamNotChanged, key, ...searchParams);
        }, 400);
      }

      return () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      };
    },
    [fetchData],
  );

  const handleScroll = useCallback(
    async (event: any | PaginationScrollEvent, key: string, ...searchParams: SearchParams[]) => {
      const listboxNode = event.currentTarget ? event.currentTarget : event.target;

      if (!listboxNode) {
        console.warn("Listbox node not found, event has no currentTarget or target");
        return;
      }

      const isScrollingDown = listboxNode.scrollTop >= lastScrollTop.current;

      // Always update the scroll position for the next event
      lastScrollTop.current = listboxNode.scrollTop;

      // --- NEW: Only proceed if scrolling down ---
      if (!isScrollingDown) {
        return;
      }
      const position = listboxNode.scrollTop + listboxNode.clientHeight;
      const scrollHeight = listboxNode.scrollHeight;

      // Check if we are at 50% of the scroll height and not currently loading
      if (
        scrollHeight * 0.5 <= position &&
        !loading.current[key] &&
        cache.current[key]?.meta?.hasNextPage !== false &&
        totalItems[key] > itemsPerPage
      ) {
        fetchPaginatedData(true, key, ...searchParams);
      }
    },
    [fetchPaginatedData, cache, lastScrollTop, totalItems, itemsPerPage],
  );

  return {
    totalItems,
    fetchPaginatedData,
    handleScroll,
  };
};
