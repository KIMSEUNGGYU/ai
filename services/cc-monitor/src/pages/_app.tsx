import { useState } from "react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
          },
        },
      })
  );

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <Component {...pageProps} />
        </TooltipProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
