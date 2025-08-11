"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ComboBox from "@/components/ComboBox/ComboBox";
import FileUploadBox from "@/components/FileUploadBox";
import Modal from "@/components/Modal/Modal";
import Slider from "@/components/Slider/Slider";
import Spinner from "@/components/Spinner/Spinner";
import { EtherInput, InputBase } from "@/components/scaffold-eth";
import { uploadToIPFS } from "@services/IPFS/thirdwebIPFS";
import { parseEther } from "viem";
import { FunnelIcon, PlusIcon } from "@heroicons/react/24/outline";
import { GigCard } from "~~/components/Card/GigCard/GigCard";
import { jobCategories } from "~~/components/Card/JobCategory/jobCategory.data";
import { JobPostingCard } from "~~/components/Card/JobPostingCard/JobPostingCard";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { fetchMaxGigPayment } from "~~/services/graphql/fetchers/gig.service";
import { fetchMaxJobPayment } from "~~/services/graphql/fetchers/job.service";
import { Gig, GigsData } from "~~/types/gig.types";
import { JobPosting, JobPostingData } from "~~/types/job.types";

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
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [filteredItems, setFilteredItems] = useState(
    type === "job" ? (data as JobPostingData)?.jobPostings || [] : (data as GigsData)?.gigs || [],
  );
  const [maxPrice, setMaxPrice] = useState<number>(0);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    bannerImageFile: undefined as File | undefined,
    paymentInEth: "",
    estimatedDurationHours: "",
    category: "",
  });

  const { writeContractAsync: createPosting, isMining } = useScaffoldWriteContract({
    contractName: type === "job" ? "JobsContract" : "GigsContract",
  });

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;

    return await uploadToIPFS(file);
  };

  const handleSubmit = async () => {
    const bannerImageHash = await handleFileUpload(form.bannerImageFile);
    try {
      if (type === "job") {
        await createPosting({
          functionName: "createJobPosting",
          args: [
            {
              title: form.title,
              description: form.description,
              bannerImageHash: bannerImageHash || "",
              basePayment: parseEther(form.paymentInEth),
              averageWorkDuration: BigInt(form.estimatedDurationHours),
              minimumNoticeTime: BigInt(24),
              category: form.category,
            },
          ],
        });
      } else {
        await createPosting({
          functionName: "createGig",
          args: [
            {
              title: form.title,
              description: form.description,
              basePayment: parseEther(form.paymentInEth),
              gigBannerImageHash: bannerImageHash || "",
              category: form.category,
              maxDurationInHours: BigInt(form.estimatedDurationHours),
            },
          ],
        });
      }
      await reload();
      setShowModal(false);
    } catch (err) {
      console.error("Failed to create job:", err);
    }
  };

  const filterItems = useMemo((): JobPosting[] | Gig[] => {
    const getCategoryFiltered = <T extends { category?: string }>(items: T[], categories: string[]) => {
      if (categories && !categories.includes("all")) {
        return items.filter(item => categories.includes(item.category ?? ""));
      }
      return items;
    };

    const getPriceFiltered = <T extends { basePayment?: string | number }>(items: T[], maxPrice: number) => {
      if (maxPrice > 0) {
        return items.filter(item => {
          const payment = Number(item.basePayment) / 1e18 || 0;
          return payment <= maxPrice;
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

    if (type === "job") {
      let items = (data as JobPostingData)?.jobPostings || [];
      items = getCategoryFiltered(items, categories);
      items = getPriceFiltered(items, maxPrice);
      items = getSorted(items, sortBy, type);
      return items;
    } else {
      let items = (data as GigsData)?.gigs || [];
      items = getCategoryFiltered(items, categories);
      items = getPriceFiltered(items, maxPrice);
      items = getSorted(items, sortBy, type);
      return items;
    }
  }, [data, categories, sortBy, maxPrice, type]);

  const fetchMaxPaymentETH = useCallback(async () => {
    setMaxPaymentETH(await (type === "job" ? fetchMaxJobPayment() : fetchMaxGigPayment()));
  }, [type]);

  useEffect(() => {
    setFilteredItems(filterItems);
    fetchMaxPaymentETH();
  }, [filterItems, fetchMaxPaymentETH, data]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row gap-8 pl-4">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64">
            <div className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 px-4">
                <FunnelIcon className="h-5 w-5" />
                Filters
              </h2>

              <ComboBox
                id="categories"
                label="Categories"
                variant="outlined"
                multiple
                value={categories}
                onChange={setCategories}
                options={optionsCategories}
                resetKey="all"
                icon={<FunnelIcon className={"h-[1.125rem] w-[1.125rem]"} />}
              />

              <div className="space-y-3">
                <label className="text-sm font-medium block px-4">Price Range (ETH)</label>
                <div className="px-4">
                  <Slider max={maxPaymentETH} defaultValue={maxPrice} onChange={setMaxPrice} />
                </div>
              </div>

              <ComboBox
                id="sort-by"
                label="Sort by"
                variant="outlined"
                value={sortBy}
                onChange={setSortBy}
                options={optionsSorts}
                icon={<FunnelIcon className={"h-[1.125rem] w-[1.125rem]"} />}
              />
            </div>
          </aside>

          {/* Jobs Listing */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="flex-1 space-y-6">
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
            </div>
          )}
        </div>
      </main>

      {/* Floating + Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-10 right-15 w-14 h-14 rounded-full text-white text-3xl shadow-lg hover:brightness-90 transition-all z-50 flex items-center justify-center"
        style={{ backgroundColor: "var(--color-accent)" }}
        aria-label={`Create ${type === "job" ? "Job Posting" : "Gig Posting"}`}
      >
        <PlusIcon className="h-5 w-5" />
      </button>

      <Modal
        title={`Create ${type === "job" ? "Job Posting" : "Gig Posting"}`}
        variant="form"
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        isOpen={showModal}
        loading={isMining}
        description={
          type === "job"
            ? "Offer your services to the community by creating a job posting."
            : "Create a gig and look for freelancers to work on your project."
        }
      >
        <div className="space-y-4">
          <InputBase placeholder="Title" value={form.title} onChange={val => setForm({ ...form, title: val })} />
          <InputBase
            placeholder="Description"
            value={form.description}
            onChange={val => setForm({ ...form, description: val })}
          />
          <FileUploadBox
            onUploadSuccess={(val: File) => setForm({ ...form, bannerImageFile: val })}
            //onUploadError={Render error message}
            acceptedFileType={"Image"}
          />
          <EtherInput
            placeholder="Payment"
            value={form.paymentInEth}
            onChange={val => setForm({ ...form, paymentInEth: val })}
          />
          <InputBase
            placeholder="Estimated Duration (hours)"
            value={form.estimatedDurationHours}
            onChange={val => setForm({ ...form, estimatedDurationHours: val })}
          />
          <ComboBox
            id="category-combo"
            label="Category"
            value={form.category}
            onChange={val => setForm({ ...form, category: val })}
            options={jobCategories}
            variant="standard"
          />
        </div>
      </Modal>
    </div>
  );
}
