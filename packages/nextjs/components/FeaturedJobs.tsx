import { JobCard } from "@/components/JobCard";

const featuredJobs = [
  {
    postingId: "1",
    freelancer: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
    title: "I'll create a Figma perfect for your next project!",
    description: "I'll create a Figma for your next Web Application.",
    bannerImageUrl: "",
    basePayment: "1000000000000000000", // 1 ETH in wei
    category: "Design",
    minimumNoticeTime: 24, // in hours
    averageWorkDuration: 5, // in hours
    createdAt: "1674000000",
    rating: 4.8,
  },
  {
    postingId: "2",
    freelancer: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
    title: "Stunning 3D Art for Games & Animation",
    description: "Custom 3D models and assets for your game or animation project.",
    bannerImageUrl: "",
    basePayment: "1000000000000000000", // 1 ETH in wei
    category: "3D Art",
    minimumNoticeTime: 24, // in hours
    averageWorkDuration: 5, // in hours
    createdAt: "1674000000",
    rating: 4.9,
  },
  {
    postingId: "3",
    freelancer: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
    title: "Professional Photo Editing & Retouching",
    description: "Enhance your photos with expert editing and retouching services.",
    bannerImageUrl: "",
    basePayment: "1000000000000000000", // 1 ETH in wei
    category: "Photography",
    minimumNoticeTime: 24, // in hours
    averageWorkDuration: 5, // in hours
    createdAt: "1674000000",
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
            <JobCard jobPosting={job} key={job.postingId} />
          ))}
        </div>
      </div>
    </section>
  );
}
