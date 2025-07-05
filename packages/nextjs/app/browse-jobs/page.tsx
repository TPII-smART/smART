"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
//import { useState } from "react";
//import Button from "@/components/Button";
import { JobCard } from "@/components/JobCard";
import { EtherInput, InputBase } from "@/components/scaffold-eth";
import DropMenu from "@/components/ui/DropMenu";
import Slider from "@/components/ui/Slider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
//import { Input } from "@/components/ui/Input";
import { Filter } from "lucide-react";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type Job = {
  jobId: string;
  freelancer?: `0x${string}`;
  client?: `0x${string}`;
  payment?: string;
  title?: string;
  description?: string;
  category?: string;
  estimatedDuration?: string;
  createdAt?: string;
  acceptedAt?: string;
  deadline?: string;
  completedAt?: string;
  cancelledAt?: string;
};

type JobsData = {
  jobs: Job[];
};

const fetchMaxPayment = async () => {
  const query = gql`
    query GetJobsPayments {
      jobs {
        items {
          payment
        }
      }
    }
  `;
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  const res = await request<{ jobs: { items: { payment?: string }[] } }>(endpoint, query);
  const payments = res.jobs.items.map(item => Number(item.payment) || 0);
  return payments.length > 0 ? Math.max(...payments) : 0;
};

const fetchJobs = async () => {
  const query = gql`
    query GetJobs {
      jobs(orderBy: "createdAt", orderDirection: "desc") {
        items {
          jobId
          freelancer
          client
          payment
          title
          description
          category
          estimatedDuration
          createdAt
          acceptedAt
          deadline
          completedAt
          cancelledAt
        }
      }
    }
  `;
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  const res = await request<{ jobs: { items: Job[] } }>(endpoint, query);
  return { jobs: res.jobs.items };
};

export default function BrowsePage() {
  const queryClient = useQueryClient();
  const { data } = useQuery<JobsData>({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const [maxPaymentETH, setMaxPaymentETH] = useState<number>(1);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
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

    jobs = jobs.filter(job => {
      if (category && category !== "all") {
        return job.category === category;
      }
      return true;
    });

    jobs = jobs.filter(job => {
      if (maxPrice > 0) {
        const payment = Number(job.payment) || 0;
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
  }, [data, category, sortBy, maxPrice]);

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

              <div className="space-y-3" style={{ zIndex: 30, position: "relative" }}>
                <label className="text-sm font-medium block px-4">Category</label>
                <div className="px-0">
                  <DropMenu
                    value={category}
                    onChange={setCategory}
                    options={[
                      { id: "all", label: "All", icon: Filter, color: "#a3a3a3" },
                      { id: "creative-writing", label: "Creative Writing", icon: Filter, color: "#fbbf24" },
                      { id: "technical-writing", label: "Technical Writing", icon: Filter, color: "#38bdf8" },
                      { id: "marketing-copy", label: "Marketing Copy", icon: Filter, color: "#f472b6" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium block px-4">Price Range (ETH)</label>
                <div className="px-4">
                  <Slider max={maxPaymentETH} defaultValue={maxPrice} onChange={setMaxPrice} />
                </div>
              </div>

              <div className="space-y-3" style={{ zIndex: 20, position: "relative" }}>
                <label className="text-sm font-medium block px-4">Sort By</label>
                <div className="px-0">
                  <DropMenu
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      { id: "recent", label: "Most Recent", icon: Filter, color: "#a3a3a3" },
                      { id: "popular", label: "Most Popular", icon: Filter, color: "#38bdf8" },
                      { id: "price-low", label: "Price: Low to High", icon: Filter, color: "#fbbf24" },
                      { id: "price-high", label: "Price: High to Low", icon: Filter, color: "#f472b6" },
                    ]}
                  />
                </div>
              </div>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-primary text-black rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-primary-content">Create a Job</h2>
            <InputBase placeholder="Title" value={form.title} onChange={val => setForm({ ...form, title: val })} />
            <InputBase
              placeholder="Description"
              value={form.description}
              onChange={val => setForm({ ...form, description: val })}
            />
            <EtherInput
              placeholder="Payment (ETH)"
              value={form.paymentInEth}
              onChange={val => setForm({ ...form, paymentInEth: val })}
            />
            <InputBase
              placeholder="Estimated Duration (hours)"
              value={form.estimatedDurationHours}
              onChange={val => setForm({ ...form, estimatedDurationHours: val })}
            />
            <InputBase
              placeholder="Category"
              value={form.category}
              onChange={val => setForm({ ...form, category: val })}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isMining}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                {isMining ? "Creating..." : "Create Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
