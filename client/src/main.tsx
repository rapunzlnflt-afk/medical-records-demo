import { createRoot } from "react-dom/client";
import App from "./App";
import { ensureDemoData, DEMO_DB_NAME } from "./lib/db";
import "./index.css";

// Demo mode: clear the demo's own database on every page load so data resets on refresh.
// Only DEMO_DB_NAME is deleted. The paid app shares this origin and keeps real
// records in "MedicalRecordsKeeper", which the demo must never delete.
const deleteRequest = indexedDB.deleteDatabase(DEMO_DB_NAME);
deleteRequest.onsuccess = () => void boot();
deleteRequest.onerror = () => void boot();
deleteRequest.onblocked = () => void boot();

async function boot() {
  if (!window.location.hash) {
    window.location.hash = "#/";
  }
  // Seed before mounting. Queries use staleTime: Infinity, so a page that read a
  // table mid-seed would cache the empty result for the rest of the session.
  await ensureDemoData();
  createRoot(document.getElementById("root")!).render(<App />);
}
