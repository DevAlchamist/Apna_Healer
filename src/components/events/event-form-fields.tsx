"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EventLandingFields } from "@/components/events/event-landing-fields";
import { apiFetch } from "@/lib/api-client";
import {
  applyFacilitatorChoice,
  isClubEventForm,
  type EventFormState,
} from "@/lib/event-form";
import { FACILITATOR_CHOICE_OTHER } from "@/lib/event-facilitator";
import type { ApiClubDetail, ApiEventFacilitatorOption } from "@/types/api";

const fieldLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8278]";
const fieldInput =
  "mt-2 w-full rounded-xl border border-theme-muted bg-theme-surface-muted px-3.5 py-2.5 text-sm text-theme-heading outline-none transition placeholder:text-[#b1a89d] focus:border-[#2f6f5b] focus:bg-white focus:ring-2 focus:ring-[#2f6f5b]/12";



type Props = {
  form: EventFormState;
  onChange: (patch: Partial<EventFormState>) => void;
  showStatus?: boolean;
  /** When true, event is always tied to a club (club dashboard create). */
  forceClubEvent?: boolean;
  /** Show club picker (admin create). */
  showClubPicker?: boolean;
  clubs?: ApiClubDetail[];
  labelClassName?: string;
  inputClassName?: string;
};

export function EventFormFields({
  form,
  onChange,
  showStatus = true,
  forceClubEvent = false,
  showClubPicker = false,
  clubs = [],
  labelClassName = fieldLabel,
  inputClassName = fieldInput,
}: Props) {
  const facilitatorsQuery = useQuery({
    queryKey: ["event-facilitator-options"],
    queryFn: () => apiFetch<ApiEventFacilitatorOption[]>("/api/events/facilitator-options"),
  });

  const categoriesQuery = useQuery({
    queryKey: ["event-categories"],
    queryFn: () => apiFetch<Array<{ id: string; name: string }>>("/api/admin/events/categories"),
  });

  const facilitatorOptions = facilitatorsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const isClubEvent = forceClubEvent || isClubEventForm(form);
  const showCustomFacilitator = form.facilitatorChoice === FACILITATOR_CHOICE_OTHER;

  const [newImage, setNewImage] = useState("");
  const [newVideo, setNewVideo] = useState("");

  const addImage = () => {
    if (!newImage.trim()) return;
    const current = form.completedImages || [];
    onChange({ completedImages: [...current, newImage.trim()] });
    setNewImage("");
  };

  const removeImage = (index: number) => {
    const current = form.completedImages || [];
    onChange({ completedImages: current.filter((_, i) => i !== index) });
  };

  const addVideo = () => {
    if (!newVideo.trim()) return;
    const current = form.completedVideos || [];
    onChange({ completedVideos: [...current, newVideo.trim()] });
    setNewVideo("");
  };

  const removeVideo = (index: number) => {
    const current = form.completedVideos || [];
    onChange({ completedVideos: current.filter((_, i) => i !== index) });
  };

  const handleFacilitatorChoice = (choice: string) => {
    if (choice === FACILITATOR_CHOICE_OTHER) {
      onChange({ facilitatorChoice: choice });
      return;
    }
    onChange(applyFacilitatorChoice(choice, facilitatorOptions));
  };

  return (
    <>
      {showClubPicker ? (
        <div>
          <label className={labelClassName}>Hosted by club</label>
          <select
            value={form.clubId}
            onChange={(e) => {
              const clubId = e.target.value;
              onChange({
                clubId,
                ...(clubId ? {} : { membersPay: false }),
              });
            }}
            className={inputClassName}
          >
            <option value="">Apna Healer (platform event)</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.title}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-theme-muted">
            Member pricing applies only when the event is listed under a club.
          </p>
        </div>
      ) : null}

      <div>
        <label className={labelClassName}>Event title</label>
        <input
          required
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClassName}
        />
      </div>
      <div>
        <label className={labelClassName}>Short subtitle</label>
        <input
          value={form.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          className={inputClassName}
        />
      </div>
      <div>
        <label className={labelClassName}>Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className={inputClassName}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Category</label>
          <select
            value={form.category || ""}
            onChange={(e) => onChange({ category: e.target.value })}
            className={inputClassName}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClassName}>Format</label>
          <select
            value={form.mode}
            onChange={(e) => onChange({ mode: e.target.value as EventFormState["mode"] })}
            className={inputClassName}
          >
            <option value="IN_PERSON">In person</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Starts at</label>
          <input
            required
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => onChange({ startsAt: e.target.value })}
            className={inputClassName}
          />
        </div>
        <div>
          <label className={labelClassName}>Venue / link</label>
          <input
            value={form.venue}
            onChange={(e) => onChange({ venue: e.target.value })}
            className={inputClassName}
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className={labelClassName}>Capacity</label>
          <input
            type="number"
            min={1}
            required
            value={form.capacity}
            onChange={(e) => onChange({ capacity: e.target.value })}
            className={inputClassName}
          />
        </div>
        <div>
          <label className={labelClassName}>Base price (₹)</label>
          <input
            type="number"
            min={0}
            value={form.basePrice}
            onChange={(e) => onChange({ basePrice: e.target.value })}
            className={inputClassName}
          />
        </div>
        {showStatus ? (
          <div>
            <label className={labelClassName}>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                onChange({ status: e.target.value as EventFormState["status"] })
              }
              className={inputClassName}
            >
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        ) : null}
      </div>

      {form.status === "COMPLETED" && (
        <div className="space-y-4 rounded-2xl border border-accent/60 bg-white p-5 text-left">
          <h4 className="font-display text-lg font-bold text-text-primary">
            Event Highlights (Completed Status)
          </h4>
          <p className="text-xs text-text-primary/60">
            Provide pictures and video URLs of the event to display to users on the completed event showcase.
          </p>

          <div className="space-y-3">
            <div>
              <label className={labelClassName}>Add Photo URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className={inputClassName}
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="rounded-xl bg-[#2D5A4C] px-4 text-xs font-semibold text-white hover:bg-[#204439]"
                >
                  Add
                </button>
              </div>
            </div>

            {form.completedImages && form.completedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {form.completedImages.map((url, idx) => (
                  <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Highlight ${idx}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className={labelClassName}>Add Video URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={newVideo}
                  onChange={(e) => setNewVideo(e.target.value)}
                  className={inputClassName}
                />
                <button
                  type="button"
                  onClick={addVideo}
                  className="rounded-xl bg-[#2D5A4C] px-4 text-xs font-semibold text-white hover:bg-[#204439]"
                >
                  Add
                </button>
              </div>
            </div>

            {form.completedVideos && form.completedVideos.length > 0 && (
              <div className="space-y-1">
                {form.completedVideos.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs">
                    <span className="truncate text-text-primary/70">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeVideo(idx)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <label className={labelClassName}>Facilitator</label>
        <select
          value={form.facilitatorChoice}
          onChange={(e) => handleFacilitatorChoice(e.target.value)}
          className={inputClassName}
          disabled={facilitatorsQuery.isLoading}
        >
          {facilitatorsQuery.isLoading ? (
            <option value={form.facilitatorChoice}>Loading facilitators…</option>
          ) : (
            <>
              {facilitatorOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
              <option value={FACILITATOR_CHOICE_OTHER}>Other (custom name)</option>
            </>
          )}
        </select>
        {!showCustomFacilitator && form.facilitatorName ? (
          <p className="mt-2 text-sm text-theme-muted">
            {form.facilitatorName}
            {form.facilitatorRole ? ` · ${form.facilitatorRole}` : null}
          </p>
        ) : null}
      </div>

      {showCustomFacilitator ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>Facilitator name</label>
              <input
                value={form.facilitatorName}
                onChange={(e) => onChange({ facilitatorName: e.target.value })}
                className={inputClassName}
                placeholder="Custom facilitator name"
              />
            </div>
            <div>
              <label className={labelClassName}>Facilitator role</label>
              <input
                value={form.facilitatorRole}
                onChange={(e) => onChange({ facilitatorRole: e.target.value })}
                className={inputClassName}
                placeholder="e.g. Breathwork guide"
              />
            </div>
          </div>
          <div>
            <label className={labelClassName}>Facilitator image URL</label>
            <input
              type="url"
              value={form.facilitatorImage}
              onChange={(e) => onChange({ facilitatorImage: e.target.value })}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Facilitator bio</label>
            <textarea
              rows={3}
              value={form.facilitatorBio}
              onChange={(e) => onChange({ facilitatorBio: e.target.value })}
              className={inputClassName}
            />
          </div>
        </>
      ) : null}

      <div>
        <label className={labelClassName}>Hero image URL</label>
        <input
          type="url"
          value={form.heroImageUrl}
          onChange={(e) => onChange({ heroImageUrl: e.target.value })}
          className={inputClassName}
        />
      </div>
      <div className="flex flex-wrap gap-6 text-sm text-theme-muted">
        {isClubEvent ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.membersPay}
              onChange={(e) => onChange({ membersPay: e.target.checked })}
            />
            Members pay
          </label>
        ) : null}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.nonMembersPay}
            onChange={(e) => onChange({ nonMembersPay: e.target.checked })}
          />
          Guests pay
        </label>
      </div>
      <div className="rounded-xl border border-theme-muted bg-[#f8fbf9] p-5">
        <p className={labelClassName}>Public landing page</p>
        <div className="mt-4">
          <EventLandingFields
            journeyPointsRaw={form.journeyPointsRaw}
            onJourneyPointsRaw={(v) => onChange({ journeyPointsRaw: v })}
            audienceText={form.audienceText}
            onAudienceText={(v) => onChange({ audienceText: v })}
            testimonialQuote={form.testimonialQuote}
            onTestimonialQuote={(v) => onChange({ testimonialQuote: v })}
            testimonialAuthor={form.testimonialAuthor}
            onTestimonialAuthor={(v) => onChange({ testimonialAuthor: v })}
            labelClassName={`block ${labelClassName}`}
            inputClassName={inputClassName}
          />
        </div>
      </div>
    </>
  );
}
