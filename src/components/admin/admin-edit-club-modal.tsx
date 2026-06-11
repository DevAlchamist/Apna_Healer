"use client";

import { ClubEditModal } from "@/components/clubs/club-edit-modal";
import type { ApiClubDetail } from "@/types/api";

type Props = {
  open: boolean;
  club: ApiClubDetail | null;
  onClose: () => void;
};

export function AdminEditClubModal({ open, club, onClose }: Props) {
  return (
    <ClubEditModal
      open={open}
      club={club}
      onClose={onClose}
      apiPath={club ? `/api/admin/clubs/${club.id}` : ""}
      title="Edit club"
      subtitle="Admin"
      queryKeys={[["admin-clubs"]]}
      showAdminFields
    />
  );
}
