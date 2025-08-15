"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Accordion from "./Accordion/Accordion";
import WorkPostingForm from "./WorkPostingForm/WorkPostingForm";
import Slider from "@/components/Slider/Slider";
import Spinner from "@/components/Spinner/Spinner";
import { InputBase } from "@/components/scaffold-eth";
import { Chip } from "@mui/material";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { GigCard } from "~~/components/Card/GigCard/GigCard";
import { jobCategories } from "~~/components/Card/JobCategory/jobCategory.data";
import { JobPostingCard } from "~~/components/Card/JobPostingCard/JobPostingCard";
import { fetchMaxGigPayment } from "~~/services/graphql/fetchers/gig/gig.service";
import { fetchMaxJobPayment } from "~~/services/graphql/fetchers/job";
import { Gig, GigsData } from "~~/types/gig/gig.types";
import { JobPosting, JobPostingData } from "~~/types/job";

const optionsCategories = [{ id: "all", label: "All", icon: FunnelIcon, color: "#a3a3a3" }, ...jobCategories];

const optionsSorts = [
  { id: "recent", label: "Most Recent", icon: FunnelIcon, color: "#a3a3a3" },
  { id: "popular", label: "Most Popular", icon: FunnelIcon, color: "#38bdf8" },
  { id: "price-low", label: "Price: Low to High", icon: FunnelIcon, color: "#fbbf24" },
  { id: "price-high", label: "Price: High to Low", icon: FunnelIcon, color: "#f472b6" },
];

interface BrowsePageProps {
  type: "job" | "gig";
  data: JobPostingData | GigsData;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export default function BrowsePage({ type, data, isLoading, reload }: BrowsePageProps) {
  const [maxPaymentETH, setMaxPaymentETH] = useState<number>(1);
  const [categories, setCategories] = useState<Set<string>>(new Set(["all"]));
  const [sortBy, setSortBy] = useState<string>("recent");
  const [filteredItems, setFilteredItems] = useState<(JobPosting | Gig)[]>(
    type === "job" ? (data as JobPostingData)?.jobPostings || [] : (data as GigsData)?.gigs || [],
  );
  // const [loading, setLoading] = useState<boolean>(false);

  // const fetchFunction = useMemo(() => (type === "job" ? fetchJobPostingsPaginated : fetchJobPostingsPaginated), [type]);

  // const { totalItems, handleScroll } = usePagination({
  //   fetchFunction,
  //   loadingFunction: setLoading,
  //   setDataFunction: setFilteredItems,
  // });

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1]);
  const [search, setSearch] = useState<string>("");

  const filterItems = useMemo((): (JobPosting | Gig)[] => {
    const getSearchFiltered = <T extends { title?: string; description?: string }>(items: T[]) => {
      if (!search) return items;
      const lowercasedSearch = search.toLowerCase();
      return items.filter(
        item =>
          item.title?.toLowerCase().includes(lowercasedSearch) ||
          false ||
          item.description?.toLowerCase().includes(lowercasedSearch) ||
          false,
      );
    };

    const getCategoryFiltered = <T extends { category?: string }>(items: T[], categories: Set<string>) => {
      if (categories && !categories.has("all")) {
        return items.filter(item => categories.has(item.category ?? ""));
      }
      return items;
    };

    const getPriceFiltered = <T extends { basePayment?: string | number }>(
      items: T[],
      priceRange: [number, number],
    ) => {
      const [minPrice, maxPrice] = priceRange;
      if (maxPrice > 0) {
        return items.filter(item => {
          const payment = Number(item.basePayment) / 1e18 || 0;
          return payment >= minPrice && payment <= maxPrice;
        });
      }
      return items;
    };

    const getSorted = <T extends { createdAt?: string; rating?: number; basePayment?: string | number }>(
      items: T[],
      sortBy: string,
      type: "job" | "gig",
    ) => {
      return [...items].sort((a, b) => {
        switch (sortBy) {
          case "recent":
            return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
          case "popular":
            return type === "job" ? (b.rating ?? 0) - (a.rating ?? 0) : 0;
          case "price-low":
            return (Number(a.basePayment) || 0) - (Number(b.basePayment) || 0);
          case "price-high":
            return (Number(b.basePayment) || 0) - (Number(a.basePayment) || 0);
          default:
            return 0;
        }
      });
    };

    let items: (JobPosting | Gig)[] =
      type === "job" ? (data as JobPostingData)?.jobPostings || [] : (data as GigsData)?.gigs || [];

    items = getCategoryFiltered(items, categories);
    items = getPriceFiltered(items, priceRange);
    items = getSearchFiltered(items);
    items = getSorted(items, sortBy, type);
    return items;
  }, [data, categories, sortBy, priceRange, search, type]);

  const fetchMaxPaymentETH = useCallback(async () => {
    const maxPayment = await (type === "job" ? fetchMaxJobPayment() : fetchMaxGigPayment());
    setMaxPaymentETH(maxPayment);
    setPriceRange([0, maxPayment]);
  }, [type]);

  useEffect(() => {
    fetchMaxPaymentETH();
  }, [fetchMaxPaymentETH]);

  useEffect(() => {
    setFilteredItems(filterItems);
  }, [filterItems, data]);

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
          className="flex  max-h-full flex-1 flex-row py-10 overflow-scroll h-[93vh]"
          onScroll={() => console.log("asd")}
        >
          {Filters}

          {/* Jobs Listing */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="flex-1 space-y-6 pr-4 mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item =>
                  type === "job" ? (
                    <JobPostingCard
                      jobPosting={item as JobPosting}
                      key={(item as JobPosting).postingId}
                      reload={reload}
                    />
                  ) : (
                    <GigCard gig={item as Gig} key={(item as Gig).gigId} reload={reload} />
                  ),
                )}
              </div>
              <div className="h-6" />
            </div>
          )}
        </div>
      </main>
      <WorkPostingForm type={type} />
    </div>
  );
}
