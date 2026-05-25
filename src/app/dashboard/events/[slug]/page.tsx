"use client";

import { EventDetailPage } from "@/components/events/event-detail-page";
import { use } from "react";

export default function DashboardEventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <EventDetailPage slug={slug} />;
}
