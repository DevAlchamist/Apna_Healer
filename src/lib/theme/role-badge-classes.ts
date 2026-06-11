/** Role badge utility classes backed by theme CSS variables. */
export const ROLE_BADGE_CLASSES = {
  therapist: "bg-theme-badge-success text-theme-badge-success",
  listener: "bg-theme-badge-warning text-theme-badge-warning",
  default: "bg-theme-badge text-theme-badge",
} as const;

export function roleBadgeClassForUserRole(role: string): string {
  if (role === "THERAPIST") return ROLE_BADGE_CLASSES.therapist;
  if (role === "LISTENER") return ROLE_BADGE_CLASSES.listener;
  return ROLE_BADGE_CLASSES.default;
}
