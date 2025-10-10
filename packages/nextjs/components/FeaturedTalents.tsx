import { TalentCard } from "~~/components/Card/TalentCard/TalentCard";

const featuredTalents = [
  {
    talentId: "1",
    freelancer: "0x1234567890abcdef1234567890abcdef12345679" as `0x${string}`,
    title: "I'll create a Figma perfect for your next project!",
    description: "I'll create a Figma for your next Web Application.",
    bannerImageHash: "https://cdn.pixabay.com/photo/2016/11/29/06/15/plans-1867745_1280.jpg",
    basePayment: "1000000000000000000", // 1 ETH in wei
    category: "Design",
    minimumNoticeTime: 24, // in hours
    averageWorkDuration: 5, // in hours
    createdAt: "1674000000",
    rating: 4.8,
  },
  {
    talentId: "2",
    freelancer: "0x1234567890abcdef1234567890abcdef12345699" as `0x${string}`,
    title: "Stunning 3D Art for Games & Animation",
    description: "Custom 3D models and assets for your game or animation project.",
    bannerImageHash: "https://cdn.pixabay.com/photo/2022/05/23/22/48/art-7217326_1280.jpg",
    basePayment: "1000000000000000000", // 1 ETH in wei
    category: "3D Art",
    minimumNoticeTime: 24, // in hours
    averageWorkDuration: 5, // in hours
    createdAt: "1674000000",
    rating: 4.9,
  },
  {
    talentId: "3",
    freelancer: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
    title: "Professional Photo Editing & Retouching",
    description: "Enhance your photos with expert editing and retouching services.",
    bannerImageHash: "https://cdn.pixabay.com/photo/2014/12/27/15/31/camera-581126_1280.jpg",
    basePayment: "1000000000000000000", // 1 ETH in wei
    category: "Photography",
    minimumNoticeTime: 24, // in hours
    averageWorkDuration: 5, // in hours
    createdAt: "1674000000",
    rating: 4.7,
  },
];

export function FeaturedTalents() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Featured Talents</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTalents.map(talent => (
            <TalentCard talent={talent} key={talent.talentId} />
          ))}
        </div>
      </div>
    </section>
  );
}
