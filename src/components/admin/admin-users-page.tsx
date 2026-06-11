"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { AdminEditUserModal } from "@/components/admin/admin-edit-user-modal";
import { UserAvatarCircle } from "@/components/dashboard/user-avatar-circle";
import { formatCurrency, formatShortDate, toSentenceCase } from "@/lib/display";
import type { ApiUser } from "@/types/api";
import { StatCardsSkeleton, TableSkeleton } from "@/components/skeletons";
import { ROLE_BADGE_CLASSES } from "@/lib/theme/role-badge-classes";

const viewport = { once: true, amount: 0.15 } as const;
const easeOut = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
};

const userSegments = ["All Users", "Listeners", "Therapists"] as const;
type UserSegment = (typeof userSegments)[number];

function getRoleClasses(tone: "green" | "sand" | "slate") {
  if (tone === "green") return ROLE_BADGE_CLASSES.therapist;
  if (tone === "sand") return ROLE_BADGE_CLASSES.listener;
  return ROLE_BADGE_CLASSES.default;
}

function getMetaClasses(tone: "default" | "success" | "danger" | "muted") {
  if (tone === "success") {
    return "text-[#7fb4a0]";
  }

  if (tone === "danger") {
    return "text-[#d55c4a]";
  }

  if (tone === "muted") {
    return "text-text-primary/35";
  }

  return "text-[#688d7b]";
}

function StatusDot({
  tone,
}: {
  tone: "active" | "danger" | "verified" | "pending";
}) {
  const className =
    tone === "active" || tone === "verified"
      ? "bg-theme-button-primary"
      : tone === "pending"
        ? "border border-[#baa591]"
        : "bg-[#cf4f45]";

  return <span className={`inline-flex h-2.5 w-2.5 rounded-full ${className}`} aria-hidden />;
}

function VerificationIcon({
  tone,
}: {
  tone: "verified" | "pending" | "danger";
}) {
  const colorClass =
    tone === "verified"
      ? "text-theme-status-success"
      : tone === "pending"
        ? "text-[#baa591]"
        : "text-theme-status-error";

  if (tone === "verified") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${colorClass}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        aria-hidden
      >
        <path
          d="m9.2 12.8 1.9 1.9 3.8-4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 3.5 5.5 6.2v5.4c0 4.1 2.8 7.7 6.5 8.9 3.7-1.2 6.5-4.8 6.5-8.9V6.2L12 3.5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tone === "pending") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${colorClass}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <circle cx="12" cy="12" r="8.2" />
        <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${colorClass}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.2" />
      <path d="m9 9 6 6M15 9l-6 6" strokeLinecap="round" />
    </svg>
  );
}

export function AdminUsersPage() {
  const [segment, setSegment] = useState<UserSegment>("All Users");
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<ApiUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<ApiUser[]>("/api/admin/users?take=200"),
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const statCards = useMemo(
    () => [
      {
        label: "Loaded Users",
        value: String(users.length),
        meta: "Live records",
        metaTone: "default" as const,
      },
      {
        label: "Therapists",
        value: String(users.filter((user) => user.role === "THERAPIST").length),
        meta: "Enabled providers",
        metaTone: "success" as const,
      },
      {
        label: "Listeners",
        value: String(users.filter((user) => user.role === "LISTENER").length),
        meta: "Support access",
        metaTone: "default" as const,
      },
      {
        label: "Verified",
        value: String(users.filter((user) => user.isVerified).length),
        meta: "Identity confirmed",
        metaTone: "muted" as const,
      },
    ],
    [users],
  );

  const filteredRows = useMemo(() => {
    const scopedUsers = users.filter((user) => {
      if (segment === "Listeners") {
        return user.role === "LISTENER";
      }

      if (segment === "Therapists") {
        return user.role === "THERAPIST";
      }

      return true;
    });

    return scopedUsers.filter((user) => {
      const query = search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        user.name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [search, segment, users]);

  return (
    <div className="space-y-7 pb-6">
      <AdminEditUserModal open={!!editUser} user={editUser} onClose={() => setEditUser(null)} />

      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className="space-y-7"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-[40px] font-semibold tracking-[-0.03em] text-theme-heading md:text-[48px]">
              User Management
            </h1>
            <p className="mt-1 max-w-[760px] text-[15px] leading-7 text-text-primary/62">
              Oversee the entire sanctuary ecosystem and manage user credentials.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full border border-[#ece7df] bg-white px-4 py-2 text-sm text-text-primary/55">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users"
                className="w-36 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-primary/35"
              />
            </label>

            <div className="relative inline-flex rounded-full bg-[#f0ede7] p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
              {userSegments.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSegment(item);
                  }}
                  className={`relative rounded-full px-5 py-2 text-sm font-medium transition ${
                    segment === item ? "text-theme-status-success" : "text-text-primary/55"
                  }`}
                >
                  {segment === item ? (
                    <motion.span
                      layoutId="user-segment-pill"
                      className="absolute inset-0 rounded-full bg-white shadow-[0_4px_14px_-8px_rgba(0,0,0,0.18)]"
                      transition={{ duration: 0.28, ease: easeOut }}
                    />
                  ) : null}
                  <span className="relative z-10">{item}</span>
                </button>
              ))}
            </div>

          </motion.div>
        </div>

        {usersQuery.isLoading ? (
          <StatCardsSkeleton count={4} />
        ) : (
        <motion.div variants={containerVariants} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <motion.article
              key={card.label}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.28, ease: easeOut }}
              className="rounded-[26px] bg-white px-5 py-5 shadow-[0_16px_38px_-28px_rgba(47,63,56,0.18)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b3a99c]">
                {card.label}
              </p>
              <div className="mt-4 flex items-end gap-2">
                <p className="font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-theme-heading">
                  {card.value}
                </p>
                <p className={`pb-1 text-xs font-semibold ${getMetaClasses(card.metaTone)}`}>
                  {card.label === "Active Now" ? <span className="text-lg leading-none">•</span> : null}
                  {card.label === "Active Now" ? "" : " "}
                  {card.meta}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
        )}
      </motion.section>

      {usersQuery.isLoading ? (
        <TableSkeleton columns={6} rows={8} hasAvatarColumn />
      ) : usersQuery.error ? (
        <section className="rounded-[30px] bg-white px-6 py-5 text-sm font-medium text-theme-status-error shadow-[0_18px_44px_-30px_rgba(47,63,56,0.18)]">
          {usersQuery.error.message}
        </section>
      ) : (
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={fadeUp}
        className="overflow-hidden rounded-[30px] bg-white shadow-[0_18px_44px_-30px_rgba(47,63,56,0.18)]"
      >
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full">
            <thead>
              <tr className="bg-[#f5f2ec] text-left">
                {[
                  "User Identity",
                  "Role",
                  "Access State",
                  "Verification",
                  "Wallet",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a48f7a]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row, index) => {
                const latestApplication = row.applications?.[0];
                const roleTone =
                  row.role === "THERAPIST"
                    ? "green"
                    : row.role === "LISTENER"
                      ? "sand"
                      : "slate";

                const accessState = latestApplication
                  ? toSentenceCase(latestApplication.status)
                  : row.role === "USER"
                    ? "Standard Access"
                    : "Provider Enabled";

                const accessTone =
                  latestApplication?.status === "REJECTED"
                    ? "danger"
                    : latestApplication?.status === "PENDING" || !row.isVerified
                      ? "pending"
                      : "active";

                const verificationTone = row.isVerified
                  ? "verified"
                  : latestApplication?.status === "REJECTED"
                    ? "danger"
                    : "pending";

                const avatarFallback =
                  row.role === "LISTENER"
                    ? "bg-linear-to-br from-[#e8ded1] to-[#d4c0a8] text-[#6e5542] text-sm"
                    : row.role === "THERAPIST"
                      ? "bg-linear-to-br from-[#17313a] to-[#45616b] text-white text-sm"
                      : "bg-linear-to-br from-[#d9ebe2] to-[#bbdaca] text-theme-status-success text-sm";

                return (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.36, delay: index * 0.06, ease: easeOut }}
                  className="border-t border-[#f4f0ea] transition-colors hover:bg-[#fcfbf8]"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <UserAvatarCircle
                        name={row.name}
                        email={row.email}
                        image={row.image}
                        className="h-11 w-11"
                        fallbackClassName={avatarFallback}
                      />
                      <div>
                        <p className="text-[22px] font-semibold leading-6 tracking-[-0.02em] text-theme-heading">
                          {row.name ?? "Unnamed user"}
                        </p>
                        <p className="mt-1 text-sm text-text-primary/48">{row.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${getRoleClasses(
                        roleTone,
                      )}`}
                    >
                      {toSentenceCase(row.role)}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-2 text-sm ${
                        accessTone === "danger" ? "text-[#b93d37]" : "text-[#2e5f4f]"
                      }`}
                    >
                      <StatusDot tone={accessTone} />
                      {accessState}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-2 text-sm ${
                        verificationTone === "danger"
                          ? "text-[#b93d37]"
                          : verificationTone === "pending"
                            ? "text-[#a58d73]"
                            : "text-[#2e5f4f]"
                      }`}
                    >
                      <VerificationIcon tone={verificationTone} />
                      {row.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-sm text-text-primary/62">
                    {formatCurrency(row.wallet?.availableBalance)}
                    <div className="mt-1 text-xs text-text-primary/38">
                      Joined {formatShortDate(row.createdAt)}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => setEditUser(row)}
                      className="rounded-full border border-[#2f745f]/25 bg-[#f4faf6] px-4 py-1.5 text-xs font-semibold text-theme-status-success transition hover:border-[#2f745f]/45 hover:bg-white"
                    >
                      Edit user
                    </button>
                  </td>
                </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5 text-sm text-text-primary/58 md:flex-row md:items-center md:justify-between">
          <p>
            Showing {filteredRows.length} of {users.length} loaded entries
          </p>

          <div className="rounded-full bg-[#f5f2ec] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-primary/45">
            Live admin directory
          </div>
        </div>
      </motion.section>
      )}

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={containerVariants}
        className="grid gap-5 xl:grid-cols-2"
      >
        <motion.article
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.28, ease: easeOut }}
          className="rounded-[30px] bg-[linear-gradient(180deg,#f1f2ee_0%,#eceee8_100%)] px-7 py-7 shadow-[0_16px_40px_-30px_rgba(47,63,56,0.16)]"
        >
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-theme-status-success shadow-[0_10px_24px_-16px_rgba(47,63,56,0.22)]">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path
                  d="M12 3.5 5.5 6.2v5.4c0 4.1 2.8 7.7 6.5 8.9 3.7-1.2 6.5-4.8 6.5-8.9V6.2L12 3.5Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="m9.2 12.8 1.9 1.9 3.8-4.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div>
              <h2 className="font-display text-[30px] font-semibold tracking-[-0.02em] text-theme-heading">
                Verification Queue
              </h2>
              <p className="mt-2 max-w-[420px] text-[15px] leading-7 text-text-primary/58">
                {users.filter((user) => !user.isVerified).length} identities currently require an
                admin review or verification step.
              </p>
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-theme-status-success transition hover:gap-3"
              >
                Review Submissions
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </motion.article>

        <motion.article
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.28, ease: easeOut }}
          className="rounded-[30px] bg-[linear-gradient(180deg,#f6efec_0%,#f3e9e6_100%)] px-7 py-7 shadow-[0_16px_40px_-30px_rgba(47,63,56,0.16)]"
        >
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f8ddd6] text-theme-status-error shadow-[0_10px_24px_-16px_rgba(207,79,69,0.25)]">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path
                  d="M12 3.5 4 8.5v7l8 5 8-5v-7l-8-5Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h2 className="font-display text-[30px] font-semibold tracking-[-0.02em] text-theme-heading">
                Urgent Safety Flags
              </h2>
              <p className="mt-2 max-w-[420px] text-[15px] leading-7 text-text-primary/58">
                Provider roles are now sourced from live platform data rather than static demo
                records.
              </p>
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-theme-status-error transition hover:gap-3"
              >
                Review Live Directory
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </motion.article>
      </motion.section>
    </div>
  );
}
