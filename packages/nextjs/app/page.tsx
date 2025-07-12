"use client";

import { FeaturedJobs } from "@/components/FeaturedJobs";
import { Hero } from "@/components/Hero";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <>
      <Hero />
      <FeaturedJobs />
    </>
  );
};

export default Home;
