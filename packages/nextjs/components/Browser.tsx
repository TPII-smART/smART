"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Accordion from "./Accordion/Accordion";
import WorkPostingForm from "./WorkPostingForm/WorkPostingForm";
import Slider from "@/components/Slider/Slider";
import Spinner from "@/components/Spinner/Spinner";
import { InputBase } from "@/components/scaffold-eth";
import { Chip } from "@mui/material";
import { GigCard } from "~~/components/Card/GigCard/GigCard";
import { jobCategories } from "~~/components/Card/JobCategory/jobCategory.data";
import { JobPostingCard } from "~~/components/Card/JobPostingCard/JobPostingCard";
import { usePagination } from "~~/hooks/use-pagination";
import { fetchGigsPaginated, fetchMaxGigPayment } from "~~/services/graphql/fetchers/gig/gig.service";
import { fetchJobPostingsPaginated, fetchMaxJobPayment } from "~~/services/graphql/fetchers/job";
import { Gig } from "~~/types/gig/gig.types";
import { JobPosting } from "~~/types/job";

const optionsCategories = [{ id: "all", label: "All" }, ...jobCategories];

const optionsSorts = [
  { id: "recent", label: "Most Recent", key: "createdAt", order: "desc" },
  // { id: "popular", label: "Most Popular", key: "rating", order: "desc" },
  { id: "price-low", label: "Price: Low to High", key: "basePayment", order: "asc" },
  { id: "price-high", label: "Price: High to Low", key: "basePayment", order: "desc" },
];

interface BrowsePageProps {
  type: "job" | "gig";
}

export default function BrowsePage({ type }: BrowsePageProps) {
  const [maxPaymentETH, setMaxPaymentETH] = useState<number>(1);
  const [categories, setCategories] = useState<Set<string>>(new Set(["all"]));
  const [sortBy, setSortBy] = useState<string>("recent");
  const [loading, setLoading] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<(JobPosting | Gig)[]>([]);

  const fetchFunction = useMemo(() => (type === "job" ? fetchJobPostingsPaginated : fetchGigsPaginated), [type]);

  const { handleScroll, fetchPaginatedData, reloadStart } = usePagination<JobPosting | Gig>({
    fetchFunction,
    loadingFunction: setLoading,
    setDataFunction: setData,
  });

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1]);
  const [search, setSearch] = useState<string>("");

  const filterItems = useCallback(
    async (fromStart: boolean = false): Promise<void> => {
      const fetchFunc = fromStart ? reloadStart : fetchPaginatedData;
      const sort = optionsSorts.find(option => option.id === sortBy);

      await fetchFunc(
        type,
        search,
        sort?.key,
        sort?.order,
        priceRange[0],
        priceRange[1],
        categories.has("all") ? undefined : Array.from(categories),
      );

      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    },
    [type, priceRange, sortBy, search, fetchPaginatedData, reloadStart, scrollRef, categories],
  );

  const fetchMaxPaymentETH = useCallback(async () => {
    const maxPayment = await (type === "job" ? fetchMaxJobPayment() : fetchMaxGigPayment());
    setMaxPaymentETH(maxPayment);
    setPriceRange([0, maxPayment]);
  }, [type]);

  useEffect(() => {
    fetchMaxPaymentETH();
  }, [fetchMaxPaymentETH]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  const Filters = (
    <aside className="w-64 mx-4">
      <div className="w-64" style={{ position: "fixed" }}>
        <InputBase
          variant="outlined"
          placeholder={`Search ${type === "job" ? "jobs" : "gigs"}...`}
          value={search}
          onChange={setSearch}
        />
        <Accordion title="Categories">
          {optionsCategories.map(value => (
            <Chip
              key={value.id}
              label={value.label}
              sx={{
                ".MuiChip-label": {
                  color: "var(--color-primary-content)",
                },
                borderRadius: "6px",
                backgroundColor: categories.has(value.id) ? "var(--color-accent)" : "var(--color-secondary)",
                margin: "4px",
              }}
              clickable
              onClick={() => {
                setCategories(prev => {
                  if (value.id === "all") {
                    return new Set(["all"]);
                  } else if (categories.has("all")) {
                    categories.delete("all");
                  }

                  const newCategories = new Set(prev);

                  if (newCategories.has(value.id)) {
                    newCategories.delete(value.id);
                  } else {
                    newCategories.add(value.id);
                  }

                  if (newCategories.size === 0) {
                    newCategories.add("all");
                  }

                  return newCategories;
                });
              }}
            />
          ))}
        </Accordion>
        <Accordion title="Price range (ETH)">
          <Slider max={maxPaymentETH} defaultValue={priceRange} onChange={v => setPriceRange(v as [number, number])} />
        </Accordion>
        <Accordion title="Sort by">
          {optionsSorts.map(value => (
            <Chip
              key={value.id}
              label={value.label}
              sx={{
                ".MuiChip-label": {
                  color: "var(--color-primary-content)",
                },
                borderRadius: "6px",
                backgroundColor: sortBy === value.id ? "var(--color-accent)" : "var(--color-secondary)",
                margin: "4px",
              }}
              clickable
              onClick={() => setSortBy(value.id)}
            />
          ))}
        </Accordion>
      </div>
    </aside>
  );

  return (
    <div className="min-h-full max-h-full flex flex-col">
      <main className="flex max-h-full">
        <div
          ref={scrollRef}
          className="flex max-h-full flex-1 flex-row py-10 overflow-scroll h-[93vh]"
          onScroll={async event => {
            const sort = optionsSorts.find(option => option.id === sortBy);
            await handleScroll(
              event,
              type,
              search,
              sort?.key,
              sort?.order,
              priceRange[0],
              priceRange[1],
              categories.has("all") ? undefined : Array.from(categories),
            );
          }}
        >
          {Filters}

          {/* Jobs Listing */}
          <div className="flex-1 flex flex-col space-y-6 pr-4 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map(item =>
                type === "job" ? (
                  <JobPostingCard
                    jobPosting={item as JobPosting}
                    key={(item as JobPosting).postingId}
                    reload={() => filterItems(true)}
                  />
                ) : (
                  <GigCard gig={item as Gig} key={(item as Gig).gigId} reload={() => filterItems(true)} />
                ),
              )}
              <div className="h-6" />
              {loading && (
                <div className="flex-1 flex items-center justify-center mb-6">
                  <Spinner />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <WorkPostingForm type={type} refresh={() => filterItems(true)} />
    </div>
  );
}
