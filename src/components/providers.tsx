"use client";
/**
 * TanStack Query provider — wraps the app for data fetching.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}

// Auto-refresh focus: when tab regains focus, refetch active queries
export function useRefetchOnFocus() {
  useEffect(() => {
    const onFocus = () => {
      // Trigger refetch via window event — actual queries subscribe via useQuery
      window.dispatchEvent(new Event("app:focus"));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
}
