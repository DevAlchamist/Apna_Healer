"use client";

import { getInitials } from "@/lib/display";

export type UserAvatarFields = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type UserAvatarCircleProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  /** Size and layout (e.g. `h-9 w-9`, `h-11 w-11`) */
  className?: string;
  /** Corner radius (default full circle) */
  roundedClassName?: string;
  /** Classes when showing initials (ignored when an image is shown) */
  fallbackClassName?: string;
  /** Extra classes on the initials `<span>` (e.g. `text-2xl`) */
  initialsClassName?: string;
};

export function UserAvatarCircle({
  name,
  email,
  image,
  className = "h-9 w-9",
  roundedClassName = "rounded-full",
  fallbackClassName = "bg-text-secondary text-xs text-white",
  initialsClassName,
}: UserAvatarCircleProps) {
  const alt =
    (typeof name === "string" && name.trim()) ||
    (typeof email === "string" && email.trim()) ||
    "Profile";

  const src = typeof image === "string" ? image.trim() : "";
  const showImage = Boolean(src);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden font-semibold ${roundedClassName} ${className} ${
        showImage ? "" : fallbackClassName
      }`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- OAuth avatars (Google CDN, etc.)
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className={initialsClassName} aria-hidden>
          {getInitials(name, email)}
        </span>
      )}
    </div>
  );
}

const participantFallback =
  "bg-linear-to-br from-[#d9ebe2] to-[#bbdaca] text-[#2f745f] text-xs";
const providerFallback =
  "bg-linear-to-br from-[#17313a] to-[#45616b] text-white text-xs";

/** Overlapping circles: participant (left) + care provider (right). */
export function UserAvatarPair({
  participant,
  provider,
  sizeClassName = "h-10 w-10",
}: {
  participant?: UserAvatarFields | null;
  provider?: UserAvatarFields | null;
  sizeClassName?: string;
}) {
  return (
    <div className="flex shrink-0 items-center -space-x-1.5">
      <UserAvatarCircle
        name={participant?.name}
        email={participant?.email}
        image={participant?.image}
        className={`relative z-10 ring-2 ring-white ${sizeClassName}`}
        fallbackClassName={participantFallback}
      />
      <UserAvatarCircle
        name={provider?.name}
        email={provider?.email}
        image={provider?.image}
        className={`relative z-0 ring-2 ring-white ${sizeClassName}`}
        fallbackClassName={providerFallback}
      />
    </div>
  );
}
