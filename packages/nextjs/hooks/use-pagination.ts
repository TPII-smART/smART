import { useCallback, useRef, useState } from "react";
import { Paginated, PaginationMetadata, SearchParams } from "~~/types/paginated.types";

type ScrollEvent = {
  currentTarget: {
    scrollTop: number;
    clientHeight: number;
    scrollHeight: number;
  };
};

type MetadataCache = {
  [key: string]: {
    meta: PaginationMetadata;
  };
};

const FILES_PER_PAGE: number = 10;

const compareParams = (a: SearchParams[], b: SearchParams[]) => {
  if (a.length !== b.length) return false;
  return a.every((param, index) => param === b[index]);
};

export interface PaginationHookParams<T> {
  fetchFunction: (...any: SearchParams[]) => Promise<Paginated<T>>;
  loadingFunction: (value: React.SetStateAction<boolean>) => void;
  setDataFunction: (value: React.SetStateAction<T[]>) => void;
}

export const usePagination = <T>({ fetchFunction, loadingFunction, setDataFunction }: PaginationHookParams<T>) => {
  // states
  const [totalItems, setTotalItems] = useState<number>(FILES_PER_PAGE);
  // refs
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSearch = useRef<SearchParams[]>([]);
  const cache = useRef<MetadataCache>({});
  const lastScrollTop = useRef<number>(0);
  const loading = useRef<boolean>(false);

  const fetchData = useCallback(
    async (hasParamNotChanged: boolean, key: string, ...params: SearchParams[]): Promise<void> => {
      loading.current = true;
      loadingFunction(true);

      const response: Paginated<T> = await fetchFunction(...params);
      setTotalItems(response.meta?.totalCount || FILES_PER_PAGE);

      cache.current[key] = { meta: response.meta };
      setDataFunction(prev => (prev.length === 0 || !hasParamNotChanged ? response.data : prev.concat(response.data)));

      setTimeout(() => {
        loadingFunction(false);
        loading.current = false;
      }, 100);
      lastSearch.current = params ?? [];
    },
    [lastSearch, setDataFunction, cache, loadingFunction, fetchFunction],
  );

  const fetchPaginatedData = useCallback(
    async (key: string, ...searchParams: SearchParams[]) => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

      const hasParamNotChanged = compareParams(lastSearch.current, searchParams);

      if (hasParamNotChanged) {
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
    async (event: ScrollEvent, key: string, ...searchParams: SearchParams[]) => {
      const listboxNode = event.currentTarget;
      const isScrollingDown = listboxNode.scrollTop > lastScrollTop.current;

      // Always update the scroll position for the next event
      lastScrollTop.current = listboxNode.scrollTop;

      // --- NEW: Only proceed if scrolling down ---
      if (!isScrollingDown) {
        return;
      }

      const position = listboxNode.scrollTop + listboxNode.clientHeight;
      const scrollHeight = listboxNode.scrollHeight;

      // Check if we are at 50% of the scroll height and not currently loading
      if (scrollHeight * 0.5 <= position && loading.current && cache.current[key]?.meta?.hasNextPage !== false) {
        fetchPaginatedData(key, ...searchParams);
      }
    },
    [fetchPaginatedData, cache, lastScrollTop],
  );

  return {
    totalItems,
    fetchPaginatedData,
    handleScroll,
  };
};
