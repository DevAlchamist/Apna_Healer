import type { ApiEventDetail, ApiEventFacilitatorOption } from "@/types/api";
import type { EventLandingFieldsInput } from "@/lib/validators/event-landing-fields";
import {
  APNA_HEALER_FACILITATOR,
  FACILITATOR_CHOICE_OTHER,
  ownerFacilitatorId,
} from "@/lib/event-facilitator";

export type EventLandingFormFields = {
  journeyPointsRaw: string;
  audienceText: string;
  testimonialQuote: string;
  testimonialAuthor: string;
};

export function splitJourneyPoints(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function journeyPointsToRaw(points: string[] | undefined | null): string {
  return points?.filter(Boolean).join("\n") ?? "";
}

export function eventLandingFormFromDetail(event: ApiEventDetail): EventLandingFormFields {
  return {
    journeyPointsRaw: journeyPointsToRaw(event.journeyPoints),
    audienceText: event.audienceText?.trim() ?? "",
    testimonialQuote: event.testimonialQuote?.trim() ?? "",
    testimonialAuthor: event.testimonialAuthor?.trim() ?? "",
  };
}

export function landingFieldsToEventPayload(form: EventLandingFormFields): EventLandingFieldsInput {
  return {
    journeyPoints: splitJourneyPoints(form.journeyPointsRaw),
    audienceText: form.audienceText.trim() || undefined,
    testimonialQuote: form.testimonialQuote.trim() || undefined,
    testimonialAuthor: form.testimonialAuthor.trim() || undefined,
  };
}

export function landingFieldsToDb(input: EventLandingFieldsInput) {
  return {
    journeyPoints: input.journeyPoints ?? [],
    audienceText: input.audienceText ?? null,
    testimonialQuote: input.testimonialQuote ?? null,
    testimonialAuthor: input.testimonialAuthor ?? null,
  };
}

export type EventFormState = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  venue: string;
  mode: "IN_PERSON" | "VIRTUAL";
  capacity: string;
  basePrice: string;
  membersPay: boolean;
  nonMembersPay: boolean;
  startsAt: string;
  heroImageUrl: string;
  clubId: string;
  facilitatorChoice: string;
  facilitatorName: string;
  facilitatorRole: string;
  facilitatorImage: string;
  facilitatorBio: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
} & EventLandingFormFields;

export function isClubEventForm(form: Pick<EventFormState, "clubId">) {
  return form.clubId.trim().length > 0;
}

export function applyFacilitatorChoice(
  choice: string,
  options: ApiEventFacilitatorOption[],
): Pick<
  EventFormState,
  "facilitatorChoice" | "facilitatorName" | "facilitatorRole" | "facilitatorImage" | "facilitatorBio"
> {
  if (choice === APNA_HEALER_FACILITATOR.id) {
    return {
      facilitatorChoice: choice,
      facilitatorName: APNA_HEALER_FACILITATOR.name,
      facilitatorRole: APNA_HEALER_FACILITATOR.role,
      facilitatorImage: "",
      facilitatorBio: "",
    };
  }
  const preset = options.find((o) => o.id === choice);
  if (preset) {
    return {
      facilitatorChoice: choice,
      facilitatorName: preset.name,
      facilitatorRole: preset.role,
      facilitatorImage: preset.imageUrl ?? "",
      facilitatorBio: "",
    };
  }
  return {
    facilitatorChoice: FACILITATOR_CHOICE_OTHER,
    facilitatorName: "",
    facilitatorRole: "",
    facilitatorImage: "",
    facilitatorBio: "",
  };
}

export function inferFacilitatorChoice(
  event: Pick<ApiEventDetail, "facilitatorName">,
  options: ApiEventFacilitatorOption[],
): string {
  const name = event.facilitatorName?.trim();
  if (!name) return APNA_HEALER_FACILITATOR.id;
  if (name === APNA_HEALER_FACILITATOR.name) return APNA_HEALER_FACILITATOR.id;
  const owner = options.find((o) => o.type === "club-owner" && o.name === name);
  if (owner) return owner.id;
  return FACILITATOR_CHOICE_OTHER;
}

export const emptyEventForm = (): EventFormState => ({
  title: "",
  subtitle: "",
  description: "",
  category: "Gathering",
  venue: "",
  mode: "IN_PERSON",
  capacity: "30",
  basePrice: "0",
  membersPay: true,
  nonMembersPay: true,
  startsAt: "",
  heroImageUrl: "",
  clubId: "",
  facilitatorChoice: APNA_HEALER_FACILITATOR.id,
  facilitatorName: APNA_HEALER_FACILITATOR.name,
  facilitatorRole: APNA_HEALER_FACILITATOR.role,
  facilitatorImage: "",
  facilitatorBio: "",
  status: "PUBLISHED",
  journeyPointsRaw: "",
  audienceText: "",
  testimonialQuote: "",
  testimonialAuthor: "",
});

export function emptyClubEventForm(defaultOwnerUserId?: string | null): EventFormState {
  const base = emptyEventForm();
  if (defaultOwnerUserId) {
    return {
      ...base,
      facilitatorChoice: ownerFacilitatorId(defaultOwnerUserId),
    };
  }
  return base;
}

export function eventFormFromDetail(
  event: ApiEventDetail,
  options: ApiEventFacilitatorOption[] = [],
): EventFormState {
  const landing = eventLandingFormFromDetail(event);
  const starts = new Date(event.startsAt);
  const localStarts = Number.isNaN(starts.getTime())
    ? ""
    : new Date(starts.getTime() - starts.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
  const facilitatorChoice =
    options.length > 0 ? inferFacilitatorChoice(event, options) : FACILITATOR_CHOICE_OTHER;
  return {
    title: event.title,
    subtitle: event.subtitle ?? "",
    description: event.description ?? "",
    category: event.category ?? "Gathering",
    venue: event.venue ?? "",
    mode: event.mode,
    capacity: String(event.capacity),
    basePrice: String(Math.round(Number(event.basePrice))),
    membersPay: event.membersPay,
    nonMembersPay: event.nonMembersPay,
    startsAt: localStarts,
    heroImageUrl: event.heroImageUrl ?? "",
    clubId: event.clubId ?? "",
    facilitatorChoice,
    facilitatorName: event.facilitatorName ?? "",
    facilitatorRole: event.facilitatorRole ?? "",
    facilitatorImage: event.facilitatorImage ?? "",
    facilitatorBio: event.facilitatorBio ?? "",
    status: event.status,
    ...landing,
  };
}

export function buildEventApiPayload(form: EventFormState) {
  const heroUrl = form.heroImageUrl.trim();
  const facilitatorImage = form.facilitatorImage.trim();
  const clubId = form.clubId.trim() || null;
  const isClubEvent = clubId != null;
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || null,
    description: form.description.trim() || null,
    category: form.category,
    venue: form.venue.trim() || null,
    mode: form.mode,
    capacity: Number(form.capacity),
    basePrice: Number(form.basePrice),
    membersPay: isClubEvent ? form.membersPay : false,
    nonMembersPay: form.nonMembersPay,
    startsAt: new Date(form.startsAt).toISOString(),
    heroImageUrl: heroUrl || null,
    clubId,
    facilitatorName: form.facilitatorName.trim() || null,
    facilitatorRole: form.facilitatorRole.trim() || null,
    facilitatorImage: facilitatorImage || null,
    facilitatorBio: form.facilitatorBio.trim() || null,
    status: form.status,
    ...landingFieldsToEventPayload(form),
  };
}
