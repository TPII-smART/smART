"use client";

import { FeaturedTalents } from "@/components/FeaturedTalents";
import { Hero } from "@/components/Hero";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="w-full h-full overflow-auto">
      <Hero />
      <FeaturedTalents />
    </div>
  );
};

export default Home;
