"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { formatShortDate, toSentenceCase } from "@/lib/display";
import { ProviderCardSkeleton, StatCardsSkeleton } from "@/components/skeletons";
import type { ApiApplication, ApiProvider } from "@/types/api";

const viewport = { once: true, amount: 0.2 } as const;
const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeBlock = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export function AdminHealersPage() {
  const [roleFilter, setRoleFilter] = useState<"ALL" | "THERAPIST" | "LISTENER">("ALL");
  const [query, setQuery] = useState("");

  const providersQuery = useQuery({
    queryKey: ["admin-healers-providers"],
    queryFn: () => apiFetch<ApiProvider[]>("/api/providers?take=100"),
  });
  const applicationsQuery = useQuery({
    queryKey: ["admin-healers-applications"],
    queryFn: () => apiFetch<ApiApplication[]>("/api/applications?take=100"),
  });

  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);

  const visibleProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesRole = roleFilter === "ALL" || provider.role === roleFilter;
      const searchableText = [
        provider.name ?? "",
        provider.bio ?? "",
        ...provider.specializations,
        ...provider.languages,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesRole && matchesQuery;
    });
  }, [providers, query, roleFilter]);

  const stats = useMemo(
    () => [
      {
        label: "Verified Providers",
        value: String(providers.length),
        meta: `${providers.filter((provider) => provider.role === "THERAPIST").length} therapists`,
      },
      {
        label: "Listener Coverage",
        value: String(providers.filter((provider) => provider.role === "LISTENER").length),
        meta: `${providers.filter((provider) => provider.nextAvailabilityDate).length} providers with availability`,
      },
      {
        label: "Delivered Sessions",
        value: String(
          providers.reduce((sum, provider) => sum + provider.sessionCount, 0),
        ),
        meta: "Across verified provider accounts",
      },
      {
        label: "Open Provider Applications",
        value: String(
          applications.filter(
            (application) =>
              (application.type === "THERAPIST" || application.type === "LISTENER") &&
              (application.status === "PENDING"),
          ).length,
        ),
        meta: `${applications.filter((application) => application.status === "APPROVED").length} approved overall`,
      },
    ],
    [applications, providers],
  );

  const openApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          (application.type === "THERAPIST" || application.type === "LISTENER") &&
          (application.status === "PENDING"),
      ),
    [applications],
  );

  const queryError = providersQuery.error?.message ?? applicationsQuery.error?.message;

  return (
    <div className="space-y-9 pb-6">
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={staggerContainer}
      >
        <motion.div variants={fadeBlock}>
          <h1 className="font-display text-[42px] font-semibold tracking-[-0.03em] text-theme-heading md:text-[52px]">
            Healer Operations
          </h1>
          <p className="mt-2 max-w-[760px] text-[15px] leading-7 text-text-primary/65 md:text-base">
            Live provider directory for therapists and listeners, including delivery volume,
            availability visibility, and application pipeline pressure.
          </p>
        </motion.div>

        {queryError ? (
          <div className="mt-6 rounded-[26px] bg-white px-6 py-5 text-sm font-medium text-theme-status-error shadow-[0_16px_44px_-34px_rgba(47,63,56,0.18)]">
            {queryError}
          </div>
        ) : null}

        {providersQuery.isLoading || applicationsQuery.isLoading ? (
          <StatCardsSkeleton count={4} className="mt-8" />
        ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <motion.article
              key={stat.label}
              variants={fadeBlock}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: easeOut }}
              className="rounded-[30px] border border-[#f0eeea] bg-white px-6 py-7 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b1a89d]">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-[52px] font-semibold leading-none tracking-[-0.04em] text-theme-status-success">
                {stat.value}
              </p>
              <p className="mt-3 text-sm text-text-primary/55">{stat.meta}</p>
            </motion.article>
          ))}
        </div>
        )}
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={staggerContainer}
          className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_-34px_rgba(47,63,56,0.18)] md:p-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[34px] font-semibold tracking-[-0.03em] text-theme-heading">
                Provider Directory
              </h2>
              <p className="mt-1 text-sm text-text-primary/55">
                {visibleProviders.length} providers loaded from the live directory
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-full border border-accent/80 bg-[#faf8f4] px-3 py-2 text-sm text-text-primary/60">
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">Role</span>
                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value as "ALL" | "THERAPIST" | "LISTENER")
                  }
                  className="bg-transparent text-sm font-semibold text-text-primary outline-none"
                >
                  {["ALL", "THERAPIST", "LISTENER"].map((option) => (
                    <option key={option} value={option}>
                      {option === "ALL" ? "All" : toSentenceCase(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-full border border-accent/80 bg-[#faf8f4] px-3 py-2 text-sm text-text-primary/60">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search providers"
                  className="w-36 bg-transparent text-sm font-semibold text-text-primary outline-none placeholder:text-text-primary/40"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {providersQuery.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProviderCardSkeleton key={i} />
                ))}
              </div>
            ) : visibleProviders.length > 0 ? (
              visibleProviders.map((provider) => {
                const tags = [...provider.specializations, ...provider.languages].slice(0, 4);

                return (
                  <motion.article
                    key={provider.id}
                    variants={fadeBlock}
                    whileHover={{ x: 4, y: -2 }}
                    transition={{ duration: 0.25, ease: easeOut }}
                    className="rounded-[22px] bg-[#fbfaf7] px-5 py-5 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <UserAvatarCircle
                          name={provider.name}
                          email={null}
                          image={provider.image}
                          className="h-12 w-12 shrink-0"
                          fallbackClassName={
                            provider.role === "THERAPIST"
                              ? "bg-linear-to-br from-[#17313a] to-[#45616b] text-white text-sm"
                              : "bg-linear-to-br from-[#e8ded1] to-[#d4c0a8] text-[#6e5542] text-sm"
                          }
                        />
                        <div className="min-w-0">
                          <p className="text-[22px] font-semibold leading-6 text-theme-heading">
                            {provider.name ?? "Verified provider"}
                          </p>
                          <p className="mt-1 text-sm leading-5 text-text-primary/45">
                            {toSentenceCase(provider.role)} • {provider.sessionCount} sessions delivered
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-theme-status-success">
                          {provider.hourlyRate ? `Rate ${provider.hourlyRate}` : "Rate not set"}
                        </p>
                        <p className="mt-1 text-xs text-text-primary/40">
                          {provider.nextAvailabilityDate
                            ? `Next slot ${formatShortDate(provider.nextAvailabilityDate)}`
                            : "No published availability"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-text-primary/62">
                      {provider.bio ?? "This provider is still completing their public profile."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {tags.length > 0 ? (
                        tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#f2ede6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/60"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-[#f2ede6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary/60">
                          Verified
                        </span>
                      )}
                    </div>
                  </motion.article>
                );
              })
            ) : (
              <div className="rounded-[22px] bg-[#fbfaf7] px-5 py-5 text-sm text-text-primary/55 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]">
                No providers matched the current filters.
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={staggerContainer}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <motion.h2
              variants={fadeBlock}
              className="font-display text-[34px] font-semibold tracking-[-0.03em] text-theme-heading"
            >
              Application Pipeline
            </motion.h2>
            <Link
              href="/admin/applications"
              className="text-sm font-semibold text-theme-status-success transition-colors hover:text-theme-heading"
            >
              Review all
            </Link>
          </div>

          <div className="space-y-4">
            {openApplications.slice(0, 6).map((application) => (
              <motion.article
                key={application.id}
                variants={fadeBlock}
                whileHover={{ x: 4, y: -2 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="rounded-[22px] bg-white px-5 py-5 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <UserAvatarCircle
                      name={application.user?.name}
                      email={application.user?.email}
                      image={application.user?.image}
                      className="h-10 w-10 shrink-0"
                      fallbackClassName="bg-linear-to-br from-[#d9ebe2] to-[#bbdaca] text-theme-status-success text-xs"
                    />
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold leading-6 text-theme-heading">
                        {application.user?.name ?? "Unnamed applicant"}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-text-primary/45">
                        {application.user?.email}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#f3efe9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9d896f]">
                    {toSentenceCase(application.status)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-text-primary/55">
                  {toSentenceCase(application.type)} • Submitted {formatShortDate(application.createdAt)}
                </p>
              </motion.article>
            ))}

            {openApplications.length === 0 ? (
              <div className="rounded-[22px] bg-white px-5 py-5 text-sm text-text-primary/55 shadow-[0_14px_40px_-34px_rgba(47,63,56,0.22)]">
                No therapist or listener applications are waiting in the queue right now.
              </div>
            ) : null}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
