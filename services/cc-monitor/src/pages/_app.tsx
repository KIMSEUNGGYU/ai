import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Component {...pageProps} />
    </TooltipProvider>
  );
}
