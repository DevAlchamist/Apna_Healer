"use client";

import { EventEditModal } from "@/components/events/event-edit-modal";
import type { ApiEventDetail } from "@/types/api";

type Props = {
  open: boolean;
  event: ApiEventDetail | null;
  onClose: () => void;
};

export function AdminEditEventModal({ open, event, onClose }: Props) {
  return (
    <EventEditModal
      open={open}
      event={event}
      onClose={onClose}
      apiPath={event ? `/api/admin/events/${event.id}` : ""}
      title="Edit event"
      subtitle="Admin"
      queryKeys={[["admin-events"]]}
    />
  );
}
