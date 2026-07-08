"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import type { ApiUser } from "@/types/api";
import { motion } from "framer-motion";

type Course = {
  id: string;
  title: string;
  progress: number;
  duration: string;
  status: "Completed" | "In Progress" | "Not Started";
  description: string;
};

const MOCK_COURSES: Course[] = [
  { id: "c-1", title: "Active Listening & Paraphrasing 101", progress: 100, duration: "2 hours", status: "Completed", description: "Learn basic techniques for non-directive feedback, validating feelings, and summarization." },
  { id: "c-2", title: "Crisis Intervention & Risk Navigation", progress: 65, duration: "3 hours", status: "In Progress", description: "Spotting crisis indicators, staying grounded, and directing members to helpline networks." },
  { id: "c-3", title: "Boundary-Setting for Sanctuary Volunteers", progress: 0, duration: "1.5 hours", status: "Not Started", description: "Guidelines on personal disclosures, dealing with difficult callers, and managing compassion fatigue." },
];

export default function TrainingCenterPage() {
  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  if (userQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f745f] border-t-transparent" />
      </div>
    );
  }

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <section className="text-left space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[#1c2826]">
          Listener Training Center
        </h1>
        <p className="text-sm text-neutral-500">
          Acquire certifications and learning modules to deliver supportive, safe volunteer listening sessions.
        </p>
      </section>

      {/* Course Grid */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6 text-left shadow-2xs space-y-6">
        <h2 className="font-display text-lg font-bold text-[#1c2826] border-b border-neutral-100 pb-3">
          Available Training Courses
        </h2>

        <div className="space-y-4">
          {MOCK_COURSES.map((course) => (
            <div
              key={course.id}
              className="p-5 rounded-lg border border-neutral-150 bg-[#fafafa] flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-neutral-800 text-sm sm:text-base">
                      {course.title}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      course.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : course.status === "In Progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{course.description}</p>
                </div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase shrink-0">
                  Length: {course.duration}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2f745f] h-full rounded-full" style={{ width: `${course.progress}%` }} />
                </div>
                <span className="text-xs font-bold text-neutral-600 shrink-0 w-8 text-right">
                  {course.progress}%
                </span>
                <button
                  onClick={() => alert(`Launching course player for: ${course.title}`)}
                  className="rounded bg-[#2f745f] hover:bg-[#204e40] text-white text-[10px] uppercase font-bold px-3 py-1.5 transition shrink-0"
                >
                  {course.status === "Completed" ? "Review" : "Study"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
