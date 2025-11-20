"use client";

import { FeaturedTalents } from "@/components/FeaturedTalents";
import { Hero } from "@/components/Hero";
import { UserGuide } from "@/components/UserGuide";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="w-full h-full overflow-auto">
      <Hero />
      <UserGuide />
      <FeaturedTalents />
    </div>
  );
};

export default Home;
