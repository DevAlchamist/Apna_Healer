"use client";

import { useQuery } from "@tanstack/react-query";
import { ProviderCardSkeleton } from "@/components/skeletons";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatShortDate, toSentenceCase } from "@/lib/display";
import type { ApiProvider } from "@/types/api";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function TherapistsPage() {
  const [specialization, setSpecialization] = useState("All");
  const [query, setQuery] = useState("");

  const providersQuery = useQuery({
    queryKey: ["provider-directory", "therapists"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?take=48&role=THERAPIST"),
  });

  const therapists = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);

  const specializationOptions = useMemo(() => {
    const optionSet = new Set<string>();

    therapists.forEach((provider) => {
      provider.specializations.forEach((value) => optionSet.add(value));
      provider.languages.forEach((value) => optionSet.add(value));
    });

    return ["All", ...Array.from(optionSet).sort((left, right) => left.localeCompare(right))];
  }, [therapists]);

  const visibleProviders = useMemo(() => {
    return therapists.filter((provider) => {
      const matchesSpecialization =
        specialization === "All" ||
        provider.specializations.includes(specialization) ||
        provider.languages.includes(specialization);
      const normalizedQuery = query.trim().toLowerCase();
      const searchableText = [
        provider.name ?? "",
        provider.bio ?? "",
        ...provider.specializations,
        ...provider.languages,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesSpecialization && matchesQuery;
    });
  }, [therapists, query, specialization]);

  const featuredProvider = visibleProviders[0] ?? therapists[0] ?? null;

  return (
    <FadeIn className="space-y-10 pb-6 md:space-y-12">
      <motion.section
        className="relative overflow-hidden rounded-calm bg-linear-to-r from-[#ccfaeb] to-[#c7fff0] p-6 md:p-7"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={morphTransition}
      >
        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_320px] md:gap-8">
          <div>
            <p className="inline-flex rounded-full bg-black/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-primary/65">
              Therapist directory
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-text-secondary md:text-5xl">
              Find the right support fit
            </h1>
            <p className="mt-3 max-w-xl text-base text-text-primary/70 md:text-lg">
              Browse verified therapists on the platform, review their expertise, and open a live
              booking view when you are ready.
            </p>
            {featuredProvider ? (
              <Link
                href={`/dashboard/therapist/${featuredProvider.id}`}
                className="mt-6 inline-flex rounded-full bg-text-secondary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(47_93_80/45%)]"
              >
                View featured therapist
              </Link>
            ) : null}
          </div>

          <motion.div
            className="mx-auto h-52 w-full max-w-[320px] overflow-hidden rounded-calm md:h-56"
            whileHover={{ y: -4, transition: hoverLiftTransition }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1618220179428-22790b461013?w=700&q=80&auto=format&fit=crop"
              alt="Therapy session"
              className="h-full w-full object-cover transition-transform duration-620 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.06]"
            />
          </motion.div>
        </div>
      </motion.section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-semibold text-text-primary md:text-5xl">Find your guide</h2>
            <p className="mt-1 text-sm font-medium text-text-primary/65">
              {visibleProviders.length} verified therapists available for your journey
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-accent/90 bg-white px-3 py-2">
              <span className="text-xs font-semibold text-text-primary/60">Expertise</span>
              <select
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
                className="bg-transparent text-xs font-semibold text-text-primary outline-none"
              >
                {specializationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 rounded-full border border-accent/90 bg-white px-3 py-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-text-primary/55" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search expertise"
                className="w-28 bg-transparent text-xs font-semibold text-text-primary outline-none placeholder:text-text-primary/45 md:w-36"
              />
            </label>
          </div>
        </div>

        {providersQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        ) : providersQuery.error ? (
          <div className="rounded-calm bg-white px-5 py-4 text-sm font-medium text-[#cf4f45] shadow-soft">
            {providersQuery.error.message}
          </div>
        ) : visibleProviders.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleProviders.map((provider, index) => {
              const tags = [...provider.specializations, ...provider.languages].slice(0, 4);

              return (
                <Link
                  key={provider.id}
                  href={`/dashboard/therapist/${provider.id}`}
                  className="block rounded-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  <motion.article
                    className="group h-full rounded-calm border border-accent/80 bg-white p-3 shadow-soft transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-primary/30 hover:shadow-soft-hover"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...morphTransition, delay: 0.05 + index * 0.03 }}
                    whileHover={{ y: -5, transition: hoverLiftTransition }}
                  >
                    <div className="relative overflow-hidden rounded-gentle">
                      {provider.image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={provider.image}
                            alt={provider.name ?? "Provider"}
                            className="h-44 w-full object-cover transition-transform duration-620 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.06]"
                          />
                        </>
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-[#e8f4ee] text-lg font-semibold text-text-secondary">
                          {provider.name?.slice(0, 1) ?? "A"}
                        </div>
                      )}
                      <span className="absolute right-2 top-2 inline-flex rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-text-primary/70 shadow-sm">
                        {toSentenceCase(provider.role)}
                      </span>
                    </div>

                    <div className="px-1 pb-1 pt-3">
                      <h3 className="text-xl font-semibold text-text-primary">
                        {provider.name ?? "Verified provider"}
                      </h3>
                      <p className="text-sm text-text-primary/70">
                        {provider.bio ?? "Profile details are being completed."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tags.length > 0 ? (
                          tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#f2ede6] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-primary/60"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-[#f2ede6] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-primary/60">
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-primary/45">
                            Session Fee
                          </p>
                          <p className="font-display text-2xl font-semibold text-text-primary">
                            {provider.hourlyRate ? formatCurrency(provider.hourlyRate) : "On request"}
                          </p>
                          <p className="text-[10px] text-text-primary/40">
                            {provider.nextAvailabilityDate
                              ? `Next: ${formatShortDate(provider.nextAvailabilityDate)}`
                              : "Availability coming soon"}
                          </p>
                        </div>

                        <motion.span
                          className="inline-flex rounded-full bg-text-secondary px-5 py-2 text-sm font-semibold text-white shadow-sm"
                          whileHover={{ scale: 1.05, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          transition={hoverLiftTransition}
                        >
                          View
                        </motion.span>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-calm bg-white px-5 py-4 text-sm text-text-primary/58 shadow-soft">
            No therapists matched the current filters.
          </div>
        )}
      </section>
    </FadeIn>
  );
}
