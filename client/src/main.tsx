import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Demo mode: clear database on every page load so data resets on refresh
const deleteRequest = indexedDB.deleteDatabase("MedicalRecordsKeeper");
deleteRequest.onsuccess = () => boot();
deleteRequest.onerror = () => boot();
deleteRequest.onblocked = () => boot();

function boot() {
  if (!window.location.hash) {
    window.location.hash = "#/";
  }
  createRoot(document.getElementById("root")!).render(<App />);
}
