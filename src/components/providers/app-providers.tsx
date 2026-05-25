"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { BookSessionModalProvider } from "@/components/dashboard/book-session-modal";
import { ListenerSupportModalProvider } from "@/components/dashboard/listener-support-modal";
import { SessionExpiryRedirect } from "@/components/providers/session-expiry-redirect";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider refetchInterval={60} refetchOnWindowFocus>
      <QueryClientProvider client={queryClient}>
        <BookSessionModalProvider>
          <ListenerSupportModalProvider>
            <SessionExpiryRedirect />
            {children}
          </ListenerSupportModalProvider>
        </BookSessionModalProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
