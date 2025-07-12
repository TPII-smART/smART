"use client";

import { FeaturedJobs } from "@/components/FeaturedJobs";
import { Hero } from "@/components/Hero";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="w-full">
      <Hero />
      <FeaturedJobs />
    </div>
  );
};

export default Home;
