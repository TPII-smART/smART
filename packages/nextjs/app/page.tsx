"use client";

import { FeaturedJobs } from "@/components/FeaturedJobs";
import { Hero } from "@/components/Hero";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <>
      <div>
        <main className="flex-1">
          <Hero />
          <FeaturedJobs />
        </main>
      </div>
    </>
  );
};

export default Home;
