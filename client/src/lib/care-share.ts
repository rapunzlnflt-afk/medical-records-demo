// MedRecords Care sharing, demo edition. The demo has no server, so the
// "from their phone" entries are fixed sample entries and nothing is uploaded.

import type { CareEntry } from "@shared/schema";
import { demoCaregiverEntries } from "./demo-care";

export type CloudCareEntry = CareEntry & { cloudId: string; settled: boolean };

export async function fetchCaregiverEntries(patientId: number, day: string): Promise<CloudCareEntry[]> {
  return demoCaregiverEntries(patientId, day);
}

/** No-op in the demo: nothing is shared with caregivers. */
export async function syncOwnerEntries(_patientId: number): Promise<void> {}
