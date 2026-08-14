import { createRoot } from "react-dom/client";
import App from "./App";
import { ensureDemoData } from "./lib/db";
import "./index.css";

// The existing demo seed initializes a blank database with the sample profile.
// Keep local entries through a normal reload so the demo can show the product's
// persistence behavior; no network or service worker data is involved.
async function boot() {
  if (!window.location.hash) {
    window.location.hash = "#/";
  }
  // Seed before mounting. Queries use staleTime: Infinity, so a page that read a
  // table mid-seed would cache the empty result for the rest of the session.
  await ensureDemoData();
  createRoot(document.getElementById("root")!).render(<App />);
}
