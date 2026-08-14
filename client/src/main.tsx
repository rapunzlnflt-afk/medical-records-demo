import { createRoot } from "react-dom/client";
import App from "./App";
import { ensureDemoData } from "./lib/db";
import "./index.css";

// Demo mode: clear database on every page load so data resets on refresh.
// The normal seed below includes the sample notes as well as the original data.
const deleteRequest = indexedDB.deleteDatabase("MedicalRecordsKeeper");
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
