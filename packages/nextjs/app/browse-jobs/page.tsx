"use client";

//import { useState } from "react";
//import Button from "@/components/Button";
import { JobCard } from "@/components/JobCard";
import DropMenu from "@/components/ui/DropMenu";
import Slider from "@/components/ui/Slider";
//import { Input } from "@/components/ui/Input";
import { Filter } from "lucide-react";

const jobs = [
  {
    id: 1,
    title: "I'll create a Figma perfect for your next project!",
    description: "I'll create a Figma for your next Web Application.",
    price: "0.1 ETH",
    category: "Design",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Stunning 3D Art for Games & Animation",
    description: "Custom 3D models and assets for your game or animation project.",
    price: "0.2 ETH",
    category: "3D Art",
    rating: 4.9,
  },
  {
    id: 3,
    title: "Professional Photo Editing & Retouching",
    description: "Enhance your photos with expert editing and retouching services.",
    price: "0.08 ETH",
    category: "Photography",
    rating: 4.7,
  },
];

export default function BrowsePage() {
  // const [priceRange, setPriceRange] = useState([0, 1]);

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
                  <Slider />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    {/*<span>{priceRange[0]} ETH</span>*/}
                    {/*<span>{priceRange[1]} ETH</span>*/}
                  </div>
                </div>
              </div>

              <div className="space-y-3" style={{ zIndex: 20, position: "relative" }}>
                <label className="text-sm font-medium block px-4">Sort By</label>
                <div className="px-0">
                  <DropMenu
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

          {/* Prompts Grid */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              {/* <Input placeholder="Search prompts..." className="max-w-md" /> */}
              {/* <Button variant={"primary"}>Search</Button> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <JobCard job={job} key={job.id} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
