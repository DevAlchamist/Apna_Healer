import type { ApiEventDetail } from "@/types/api";
import {
  DEFAULT_AUDIENCE_TEXT,
  DEFAULT_JOURNEY_POINTS,
} from "@/lib/validators/event-landing-fields";

const DEFAULT_FACILITATOR_IMAGE =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80&auto=format&fit=crop";

export type EventLandingDisplay = {
  about: string[];
  journeyPoints: string[];
  audienceText: string;
  facilitatorName: string;
  facilitatorRole: string;
  facilitatorImage: string;
  facilitatorBio: string;
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
};

export function eventLandingDisplay(event: ApiEventDetail): EventLandingDisplay {
  const paragraphs = event.description
    ? event.description.split(/\n\n+/).filter(Boolean)
    : [event.subtitle ?? event.excerpt].filter(Boolean);

  return {
    about:
      paragraphs.length > 0 ? paragraphs : ["Join us for a guided wellness gathering."],
    journeyPoints:
      event.journeyPoints?.filter(Boolean).length > 0
        ? event.journeyPoints.filter(Boolean)
        : [...DEFAULT_JOURNEY_POINTS],
    audienceText:
      event.audienceText?.trim() ||
      event.subtitle?.trim() ||
      DEFAULT_AUDIENCE_TEXT,
    facilitatorName: event.facilitatorName ?? event.host,
    facilitatorRole: event.facilitatorRole ?? "Facilitator",
    facilitatorImage: event.facilitatorImage ?? DEFAULT_FACILITATOR_IMAGE,
    facilitatorBio:
      event.facilitatorBio ??
      "Experienced wellness facilitator guiding this gathering.",
    testimonialQuote: event.testimonialQuote?.trim() || null,
    testimonialAuthor: event.testimonialAuthor?.trim() || null,
  };
}
