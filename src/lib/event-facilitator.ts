export const APNA_HEALER_FACILITATOR = {
  id: "apna-healer",
  name: "Apna Healer",
  role: "Apna Healer",
  imageUrl: null as string | null,
} as const;

export const FACILITATOR_CHOICE_OTHER = "other";

export function ownerFacilitatorId(userId: string) {
  return `owner:${userId}`;
}

export function isOwnerFacilitatorChoice(choice: string) {
  return choice.startsWith("owner:");
}

export function ownerIdFromFacilitatorChoice(choice: string): string | null {
  return isOwnerFacilitatorChoice(choice) ? choice.slice("owner:".length) : null;
}
