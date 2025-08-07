"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ComboBox from "@/components/ComboBox/ComboBox";
import FileUploadBox from "@/components/FileUploadBox";
import { JobCard } from "@/components/JobCard";
import Modal from "@/components/Modal/Modal";
import Slider from "@/components/Slider/Slider";
import Spinner from "@/components/Spinner/Spinner";
import { EtherInput, InputBase } from "@/components/scaffold-eth";
import { uploadToIPFS } from "@services/IPFS/thirdwebIPFS";
import { fetchJobPostings, fetchMaxPayment } from "@services/graphql/fetchers/job.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { FunnelIcon, PlusIcon } from "@heroicons/react/24/outline";
import { jobCategories } from "~~/components/JobCard/JobCategory/jobCategory.data";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { JobPosting, JobPostingData } from "~~/types/job.types";

const optionsCategories = [{ id: "all", label: "All", icon: FunnelIcon, color: "#a3a3a3" }, ...jobCategories];

const optionsSorts = [
  { id: "recent", label: "Most Recent", icon: FunnelIcon, color: "#a3a3a3" },
  { id: "popular", label: "Most Popular", icon: FunnelIcon, color: "#38bdf8" },
  { id: "price-low", label: "Price: Low to High", icon: FunnelIcon, color: "#fbbf24" },
  { id: "price-high", label: "Price: High to Low", icon: FunnelIcon, color: "#f472b6" },
];

export default function BrowsePage() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<JobPostingData>({
    queryKey: ["jobPostings"],
    queryFn: fetchJobPostings,
  });

  const [maxPaymentETH, setMaxPaymentETH] = useState<number>(1);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>(data?.jobPostings || []);
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

  const { writeContractAsync: createJobPosting, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["jobPostings"] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;

    return await uploadToIPFS(file);
  };

  const handleSubmit = async () => {
    const bannerImageUrl = await handleFileUpload(form.bannerImageFile);
    try {
      await createJobPosting({
        functionName: "createJobPosting",
        args: [
          {
            title: form.title,
            description: form.description,
            bannerImageUrl: bannerImageUrl || "",
            basePayment: parseEther(form.paymentInEth),
            averageWorkDuration: BigInt(form.estimatedDurationHours),
            minimumNoticeTime: BigInt(24), // minimumNoticeTime, can be set to 24 for now
            category: form.category,
          },
        ],
      });
      await reload();
      setShowModal(false);
    } catch (err) {
      console.error("Failed to create job:", err);
    }
  };

  const filterJobs = useMemo((): JobPosting[] => {
    let jobPostings = data?.jobPostings || [];

    console.log("Filtering jobs with categories:", categories);
    if (categories && !categories.some(v => v === "all")) {
      jobPostings = jobPostings.filter(jobPosting => categories.some(cat => cat === jobPosting.category));
    }

    jobPostings = jobPostings.filter(jobPosting => {
      if (maxPrice > 0) {
        const payment = Number(jobPosting.basePayment) / 1e18 || 0;
        return payment <= maxPrice;
      }
      return true;
    });

    jobPostings = jobPostings.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
        case "popular":
          return a.rating ? (b.rating ? b.rating - a.rating : -1) : 1;
        case "price-low":
          return (Number(a.basePayment) || 0) - (Number(b.basePayment) || 0);
        case "price-high":
          return (Number(b.basePayment) || 0) - (Number(a.basePayment) || 0);
        default:
          return 0; // Default case, no sorting
      }
    });

    return jobPostings;
  }, [data, categories, sortBy, maxPrice]);

  const fetchMaxPaymentETH = useCallback(async () => {
    setMaxPaymentETH(await fetchMaxPayment());
  }, []);

  useEffect(() => {
    setFilteredJobs(filterJobs);
    fetchMaxPaymentETH();
  }, [filterJobs, fetchMaxPaymentETH, data]);

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
                {filteredJobs.map(jobPosting => (
                  <JobCard jobPosting={jobPosting} key={jobPosting.postingId} reload={reload} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating + Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full text-white text-3xl shadow-lg hover:brightness-90 transition-all z-50 flex items-center justify-center"
        style={{ backgroundColor: "var(--color-accent)" }}
        aria-label="Create Job"
      >
        <PlusIcon className="h-5 w-5" />
      </button>

      <Modal
        title="Create a job posting"
        variant="form"
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        isOpen={showModal}
        loading={isMining}
        description="Offer your services to the community by creating a job posting."
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
