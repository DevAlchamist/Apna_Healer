import { FadeIn } from "@/components/ui/fade-in";
import { TherapistBookingCard } from "@/components/dashboard/therapist-booking-card";
import { therapists } from "@/data/therapists";
import { notFound } from "next/navigation";

const availableTimes = ["09:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"];

export default async function TherapistDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const therapist = therapists.find((entry) => entry.id === id);

  if (!therapist) {
    notFound();
  }

  return (
    <FadeIn className="space-y-10 pb-6 md:space-y-12">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,430px)] xl:gap-10">
        <article
          className="space-y-8"
        >
          <div className="relative overflow-hidden rounded-calm">
            <img src={therapist.image} alt={therapist.name} className="h-[300px] w-full object-cover md:h-[380px]" />

            <div className="absolute bottom-5 left-1/2 flex w-[min(90%,360px)] -translate-x-1/2 items-center justify-between rounded-gentle bg-white px-4 py-3 shadow-soft">
              <div className="px-2 text-center">
                <p className="font-display text-2xl font-semibold text-text-secondary">{therapist.yearsExperience}+</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">Years Exp</p>
              </div>
              <div className="h-9 w-px bg-accent/80" />
              <div className="px-2 text-center">
                <p className="font-display text-2xl font-semibold text-text-secondary">{therapist.rating}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">Rating</p>
              </div>
              <div className="h-9 w-px bg-accent/80" />
              <div className="px-2 text-center">
                <p className="font-display text-2xl font-semibold text-text-secondary">{therapist.sessions}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">Sessions</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-5xl font-semibold text-text-primary">{therapist.name}</h1>
            <p className="text-lg text-text-secondary">{therapist.role}</p>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">About {therapist.name.split(" ")[1]}</p>
            <p className="max-w-3xl text-[1.08rem] leading-relaxed text-text-primary/72">{therapist.about}</p>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">Areas of Focus</p>
            <div className="flex flex-wrap gap-2.5">
              {therapist.focusAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full bg-[#f2ede6] px-3 py-1.5 text-xs font-semibold text-text-primary/65"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {therapist.reviews.length > 0 ? (
            <div className="space-y-4 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-primary/45">Client Reflections</p>
              <div className="grid gap-5 md:grid-cols-2">
                {therapist.reviews.map((review) => (
                  <article
                    key={review.by}
                    className="rounded-calm border border-accent/70 bg-white p-6 shadow-soft"
                  >
                    <p className="text-2xl text-text-secondary">&quot;</p>
                    <p className="-mt-1 text-base leading-relaxed text-text-primary/75">{review.quote}</p>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-text-primary/45">{review.by}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <div className="space-y-6">
          <TherapistBookingCard therapist={therapist} availableTimes={availableTimes} />
          <div className="space-y-3.5 rounded-calm border border-accent/70 bg-white p-6 shadow-soft md:p-7">
            <div className="rounded-gentle bg-primary/10 p-3 text-sm text-text-primary/75">
              <p className="font-semibold text-text-secondary">Secure Payment</p>
              <p>Pay only after session confirmation.</p>
            </div>
            <div className="rounded-gentle bg-background p-3 text-sm text-text-primary/62">
              Note: {therapist.name.split(" ")[1]} is currently accepting new clients. Usual reply time is within 24 hours.
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
