import type { Metadata } from "next";
import { AboutLanding } from "@/components/about/about-landing";

export const metadata: Metadata = {
  title: "About | Apna Healer",
  description:
    "Our narrative, growth journey, and the people behind ApnaHealer — a sanctuary for quiet healing.",
};

export default function AboutPage() {
  return <AboutLanding />;
}
