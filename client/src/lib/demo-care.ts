// Demo-only MedRecords Care sample data for the fictional "Rose Rivera".
// Times are relative to the visitor's clock so the log always looks current,
// and today's entries never show a time later than now.

import type { CareEntry } from "@shared/schema";
import { localDay, shiftDay } from "./care";

type Seed = Omit<CareEntry, "id" | "patientId" | "at" | "createdAt"> & { time: string };

const pad = (n: number) => String(n).padStart(2, "0");
function nowHM(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Entries logged on this phone (by Jamie) or already copied from a caregiver's phone. */
const TODAY: Seed[] = [
  { time: "07:45", kind: "personal", status: "done", task: "bathing", help: "some", loggedBy: "Denise" },
  { time: "08:15", kind: "meal", status: "done", meal: "breakfast", amount: "most", details: "Oatmeal, half a banana, coffee", loggedBy: "Denise" },
  { time: "09:00", kind: "awareness", status: "done", level: "quiet", loggedBy: "Denise" },
  { time: "15:00", kind: "mood", status: "done", score: 6, note: "Enjoyed looking through old photo albums.", loggedBy: "Jamie" },
  { time: "17:45", kind: "meal", status: "done", meal: "dinner", amount: "all", details: "Baked chicken, rice, green beans", loggedBy: "Jamie" },
  { time: "19:30", kind: "personal", status: "done", task: "dressing", help: "full", loggedBy: "Jamie" },
];

const YESTERDAY: Seed[] = [
  { time: "08:00", kind: "meal", status: "done", meal: "breakfast", amount: "all", details: "Scrambled eggs, toast", loggedBy: "Denise" },
  { time: "09:15", kind: "awareness", status: "done", level: "alert", loggedBy: "Denise" },
  { time: "10:00", kind: "therapy", status: "partial", therapy: "OT", minutes: 30, details: "Buttoning practice, hand putty", note: "Got tired halfway through.", loggedBy: "Denise" },
  { time: "12:30", kind: "meal", status: "done", meal: "lunch", amount: "some", details: "Tomato soup, half a sandwich", loggedBy: "Denise" },
  { time: "14:00", kind: "mood", status: "done", score: 7, loggedBy: "Denise" },
  { time: "18:00", kind: "meal", status: "declined", meal: "dinner", reason: "tired", note: "Had a glass of milk and crackers at 7 instead.", loggedBy: "Jamie" },
];

const TWO_DAYS_AGO: Seed[] = [
  { time: "08:30", kind: "meal", status: "done", meal: "breakfast", amount: "most", loggedBy: "Denise" },
  { time: "10:30", kind: "therapy", status: "done", therapy: "PT", minutes: 45, details: "Hallway walk, sit-to-stand", loggedBy: "Denise" },
  { time: "11:00", kind: "personal", status: "declined", task: "bathing", reason: "refused", note: "Will try again tomorrow morning.", loggedBy: "Denise" },
  { time: "16:00", kind: "awareness", status: "done", level: "alert", loggedBy: "Jamie" },
];

function build(patientId: number, day: string, seeds: Seed[], onlyPast: boolean): CareEntry[] {
  const now = nowHM();
  return seeds
    .filter((s) => !onlyPast || s.time <= now)
    .map(({ time, ...rest }) => ({
      ...rest,
      patientId,
      at: `${day}T${time}`,
      createdAt: new Date().toISOString(),
    }) as CareEntry);
}

// The demo database is wiped and reseeded on every load, so this is always set
// before the Care Log asks for caregiver entries.
let samplePatientId: number | null = null;

export function buildDemoCareEntries(patientId: number): CareEntry[] {
  samplePatientId = patientId;
  const today = localDay();
  return [
    ...build(patientId, shiftDay(today, -2), TWO_DAYS_AGO, false),
    ...build(patientId, shiftDay(today, -1), YESTERDAY, false),
    ...build(patientId, today, TODAY, true),
  ];
}

/** Entries a caregiver logged from her own phone today that haven't settled onto this phone yet. */
const FROM_CAREGIVER_PHONE: Seed[] = [
  { time: "10:30", kind: "therapy", status: "done", therapy: "PT", minutes: 30, details: "Hallway walk twice, seated leg lifts", loggedBy: "Denise" },
  { time: "12:15", kind: "meal", status: "declined", meal: "lunch", reason: "not-hungry", note: "Took a few sips of soup. Offered crackers at 1.", loggedBy: "Denise" },
  { time: "13:30", kind: "meal", status: "done", meal: "snack", amount: "some", details: "Crackers and applesauce", loggedBy: "Denise" },
];

export function demoCaregiverEntries(patientId: number, day: string): (CareEntry & { cloudId: string; settled: boolean })[] {
  if (patientId !== samplePatientId || day !== localDay()) return [];
  return build(patientId, day, FROM_CAREGIVER_PHONE, true).map((e, i) => ({ ...e, cloudId: `demo-cg-${i}`, settled: false }));
}
