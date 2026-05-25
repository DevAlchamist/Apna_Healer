import type { ListenerBookingRequest, Role } from "@prisma/client";

type RequestWithRelations = ListenerBookingRequest & {
  user?: unknown;
  assignedListener?: unknown;
  session?: { id: string; status: string; startTime?: Date } | null;
};

/**
 * Hides assigned listener identity from the requester until the session is completed.
 */
export function serializeListenerBookingRequest(
  request: RequestWithRelations,
  viewer: { id: string; role: Role },
): RequestWithRelations & { listenerIdentityHidden?: boolean } {
  if (viewer.role === "ADMIN") {
    return { ...request, listenerIdentityHidden: false };
  }
  if (request.assignedListenerId && request.userId === viewer.id) {
    const sessionComplete = request.session?.status === "COMPLETED";
    if (!sessionComplete) {
    const { assignedListener, assignedListenerId, ...rest } = request;
    void assignedListener;
    void assignedListenerId;
    return {
      ...(rest as RequestWithRelations),
      assignedListener: null,
      assignedListenerId: null,
      listenerIdentityHidden: true,
    };
    }
  }
  return { ...request, listenerIdentityHidden: false };
}
