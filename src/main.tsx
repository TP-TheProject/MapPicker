import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/App";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n";
import { queryClient } from "@/lib/queryClient";

// Latin + Latin Extended-A subsets only — PT-BR and EN are both Latin script (PT-BR needs
// latin-ext for ã/ç/é/etc). The other unicode-range subsets @fontsource ships (cyrillic,
// greek, devanagari, vietnamese...) are dead weight for this app.
import "@fontsource/rajdhani/latin-600.css";
import "@fontsource/rajdhani/latin-700.css";
import "@fontsource/rajdhani/latin-ext-600.css";
import "@fontsource/rajdhani/latin-ext-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-ext-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "@fontsource/jetbrains-mono/latin-ext-400.css";
import "@fontsource/jetbrains-mono/latin-ext-600.css";
import "@/index.css";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <App />
        <Toaster />
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
);
