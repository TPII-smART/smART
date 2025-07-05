"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { Filter } from "lucide-react";
import { JobCard } from "~~/components/JobCard";
import DropMenu from "~~/components/ui/DropMenu";
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

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    payment: "0.1",
    estimatedDurationHours: "48",
    category: "",
  });

  const { writeContractAsync: createJob, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const handleSubmit = async () => {
    try {
      // Convert ETH to Gwei (1 ETH = 1_000_000_000 Gwei)
      const paymentGwei = BigInt(Math.floor(Number(form.payment || "0") * 1_000_000_000));
      await createJob({
        functionName: "createJob",
        args: [form.title, form.description, paymentGwei, BigInt(form.estimatedDurationHours), form.category],
      });
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (err) {
      console.error("Failed to create job:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row gap-8 pl-4">
          <aside className="w-full md:w-64 space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </h2>
              <div className="space-y-2" style={{ zIndex: 30, position: "relative" }}>
                <label className="text-sm font-medium">Category</label>
                <DropMenu
                  options={[
                    { id: "all", label: "All", icon: Filter, color: "#a3a3a3" },
                    { id: "creative-writing", label: "Creative Writing", icon: Filter, color: "#fbbf24" },
                    { id: "technical-writing", label: "Technical Writing", icon: Filter, color: "#38bdf8" },
                    { id: "marketing-copy", label: "Marketing Copy", icon: Filter, color: "#f472b6" },
                  ]}
                />
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.jobs.map(job => <JobCard job={job} key={job.jobId} />)}
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
          <div className="bg-white text-black rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">Create a Job</h2>
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded p-2"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded p-2"
            />
            <input
              type="text"
              placeholder="Payment in ETH"
              value={form.payment}
              onChange={e => setForm({ ...form, payment: e.target.value })}
              className="w-full border rounded p-2"
            />
            <input
              type="number"
              placeholder="Estimated Duration (hours)"
              value={form.estimatedDurationHours}
              onChange={e => setForm({ ...form, estimatedDurationHours: e.target.value })}
              className="w-full border rounded p-2"
            />
            <input
              type="text"
              placeholder="Category"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded p-2"
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
