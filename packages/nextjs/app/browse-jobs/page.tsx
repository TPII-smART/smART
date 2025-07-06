"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobCard } from "@/components/JobCard";
import { EtherInput, InputBase } from "@/components/scaffold-eth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, FilterIcon } from "lucide-react";
import { parseEther } from "viem";
import ComboBox from "~~/components/ComboBox/ComboBox";
import Modal from "~~/components/Modal/Modal";
import Slider from "~~/components/Slider/Slider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { fetchJobs, fetchMaxPayment } from "~~/services/graphql/fetchers/job.service";
import { Job, JobsData } from "~~/types/job.types";

const optionsCategoriesWithoutAll = [
  { id: "creative-writing", label: "Creative Writing", icon: Filter, color: "#fbbf24" },
  { id: "technical-writing", label: "Technical Writing", icon: Filter, color: "#38bdf8" },
  { id: "marketing-copy", label: "Marketing Copy", icon: Filter, color: "#f472b6" },
];

const optionsCategories = [{ id: "all", label: "All", icon: Filter, color: "#a3a3a3" }, ...optionsCategoriesWithoutAll];

const optionsSorts = [
  { id: "recent", label: "Most Recent", icon: Filter, color: "#a3a3a3" },
  { id: "popular", label: "Most Popular", icon: Filter, color: "#38bdf8" },
  { id: "price-low", label: "Price: Low to High", icon: Filter, color: "#fbbf24" },
  { id: "price-high", label: "Price: High to Low", icon: Filter, color: "#f472b6" },
];

export default function BrowsePage() {
  const queryClient = useQueryClient();
  const { data } = useQuery<JobsData>({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const [maxPaymentETH, setMaxPaymentETH] = useState<number>(1);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(data?.jobs || []);
  const [maxPrice, setMaxPrice] = useState<number>(0);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    paymentInEth: "0.1",
    estimatedDurationHours: "48",
    category: "",
  });

  const { writeContractAsync: createJob, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const handleSubmit = async () => {
    try {
      await createJob({
        functionName: "createJob",
        args: [
          form.title,
          form.description,
          parseEther(form.paymentInEth),
          BigInt(form.estimatedDurationHours),
          form.category,
        ],
      });
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (err) {
      console.error("Failed to create job:", err);
    }
  };

  const filterJobs = useMemo((): Job[] => {
    let jobs = data?.jobs || [];

    console.log("Filtering jobs with categories:", categories);
    if (categories && !categories.some(v => v === "all")) {
      jobs = jobs.filter(job => categories.some(cat => cat === job.category));
    }

    jobs = jobs.filter(job => {
      if (maxPrice > 0) {
        const payment = Number(job.payment) / 1e18 || 0;
        return payment <= maxPrice;
      }
      return true;
    });

    jobs = jobs.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
        // case "popular":
        //   return b.rating - a.rating; // Assuming jobs have a rating field
        case "price-low":
          return (Number(a.payment) || 0) - (Number(b.payment) || 0);
        case "price-high":
          return (Number(b.payment) || 0) - (Number(a.payment) || 0);
        default:
          return 0; // Default case, no sorting
      }
    });

    return jobs;
  }, [data, categories, sortBy, maxPrice]);

  const fetchMaxPaymentETH = useCallback(async () => {
    setMaxPaymentETH(await fetchMaxPayment());
  }, []);

  useEffect(() => {
    setFilteredJobs(filterJobs);
    fetchMaxPaymentETH();
  }, [filterJobs, fetchMaxPaymentETH]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row gap-8 pl-4">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64">
            <div className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 px-4">
                <Filter className="h-5 w-5" />
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
                icon={<FilterIcon className={"h-[1.125rem] w-[1.125rem]"} />}
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
                icon={<FilterIcon className={"h-[1.125rem] w-[1.125rem]"} />}
              />
            </div>
          </aside>

          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map(job => (
                <JobCard job={job} key={job.jobId} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating + Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white text-3xl shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        +
      </button>

      <Modal
        title="Create a job"
        variant="form"
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        isOpen={showModal}
        loading={isMining}
        description="Create a new job to find freelancers for your tasks."
      >
        <div className="space-y-4">
          <InputBase placeholder="Title" value={form.title} onChange={val => setForm({ ...form, title: val })} />
          <InputBase
            placeholder="Description"
            value={form.description}
            onChange={val => setForm({ ...form, description: val })}
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
            options={optionsCategoriesWithoutAll}
            variant="standard"
          />
        </div>
      </Modal>
    </div>
  );
}
