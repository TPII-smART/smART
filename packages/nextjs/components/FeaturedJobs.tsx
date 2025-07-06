import { JobCard } from "@/components/JobCard";

const featuredJobs = [
  {
    jobId: "1",
    title: "I'll create a Figma perfect for your next project!",
    description: "I'll create a Figma for your next Web Application.",
    price: "0.1 ETH",
    category: "Design",
    rating: 4.8,
  },
  {
    jobId: "2",
    title: "Stunning 3D Art for Games & Animation",
    description: "Custom 3D models and assets for your game or animation project.",
    price: "0.2 ETH",
    category: "3D Art",
    rating: 4.9,
  },
  {
    jobId: "3",
    title: "Professional Photo Editing & Retouching",
    description: "Enhance your photos with expert editing and retouching services.",
    price: "0.08 ETH",
    category: "Photography",
    rating: 4.7,
  },
];

export function FeaturedJobs() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Featured Jobs</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredJobs.map(job => (
            <JobCard job={job} key={job.jobId} />
          ))}
        </div>
      </div>
    </section>
  );
}
