// Plain TypeScript types — no Drizzle, no server dependencies.
// These are used by both the Dexie DB layer and all UI components.

export interface Patient {
  id?: number;
  name: string;
  relationship: string | null;
  dateOfBirth: string | null;
  color: string;
  // Profile details. All optional so patient records created before the
  // Profile tab existed keep working untouched.
  photoUrl?: string | null;
  bloodType?: string | null;
  height?: string | null;
  allergies?: string | null;
  conditions?: string | null;
  // MedRecords Care: structured health conditions (keys from
  // client/src/lib/care.ts CONDITIONS). Optional so older records and backups
  // keep working. The free-text `conditions` field above is left as-is.
  careConditions?: string[];
  /** Cancer type key, only meaningful when careConditions includes "cancer". */
  cancerType?: string | null;
  /** Free text for the "other" condition. */
  careConditionOther?: string | null;
  /** Shared with caregivers unless turned off (undefined counts as shared). */
  careConditionsShared?: boolean;
  primaryPhysicianId?: number | null;
  // Medical insurance card — one per family member. Front/back are downscaled
  // JPEG data URLs (see client/src/lib/image.ts).
  insuranceCardFront?: string | null;
  insuranceCardBack?: string | null;
  insuranceCarrier?: string | null;
  insuranceMemberId?: string | null;
  insuranceGroupNumber?: string | null;
  insurancePlanType?: string | null;
  insuranceRxBin?: string | null;
  insuranceRxPcn?: string | null;
  insuranceRxGroup?: string | null;
  insurancePhone?: string | null;
  insurancePolicyHolder?: string | null;
  insuranceEffectiveDate?: string | null;
  // Dental insurance card. Same shape minus the pharmacy fields, which are
  // medical-only.
  dentalCardFront?: string | null;
  dentalCardBack?: string | null;
  dentalCarrier?: string | null;
  dentalMemberId?: string | null;
  dentalGroupNumber?: string | null;
  dentalPlanType?: string | null;
  dentalPhone?: string | null;
  dentalPolicyHolder?: string | null;
  dentalEffectiveDate?: string | null;
}

export interface Physician {
  id?: number;
  patientId: number;
  name: string;
  specialty: string;
  phone: string | null;
  fax: string | null;
  email: string | null;
  /** Practice website. Optional; older records saved before v-website simply omit it. */
  website?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  npi: string | null;
  notes: string | null;
}

export interface Appointment {
  id?: number;
  patientId: number;
  title: string;
  physicianId: number | null;
  date: string;
  time: string;
  location: string | null;
  type: string;
  status: string;
  notes: string | null;
  reminderDate: string | null;
}

export interface Medication {
  id?: number;
  patientId: number;
  name: string;
  type: string;
  dosage: string;
  frequency: string;
  timeOfDay: string | null;
  prescribedBy: string | null;
  pharmacy: string | null;
  startDate: string | null;
  endDate: string | null;
  refillDate: string | null;
  purpose: string | null;
  sideEffects: string | null;
  notes: string | null;
  active: number;
}

export interface MedicationLog {
  id?: number;
  medicationId: number;
  date: string;
  taken: number;
  time: string | null;
  notes: string | null;
}

export interface MedicalRecord {
  id?: number;
  patientId: number;
  title: string;
  category: string;
  date: string;
  physicianId: number | null;
  description: string | null;
  notes: string | null;
  imageUrl: string | null;
  // The appointment this record belongs to, if any (e.g. lab results from a visit).
  // Optional so records saved before this existed simply have no link.
  appointmentId?: number | null;
}

export interface Vital {
  id?: number;
  patientId: number;
  date: string;
  weight: string | null;
  bloodPressureSystolic: string | null;
  bloodPressureDiastolic: string | null;
  heartRate: string | null;
  temperature: string | null;
  bloodSugar: string | null;
  oxygenSaturation: string | null;
  notes: string | null;
}

export interface EmergencyContact {
  id?: number;
  patientId: number;
  name: string;
  relationship: string;
  phone: string;
  altPhone: string | null;
  email: string | null;
  isPrimary: number;
}

export interface Pharmacy {
  id?: number;
  patientId: number;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  hours: string | null;
  website: string | null;
  notes: string | null;
  isPrimary: number;
}


export interface Note {
  id?: number;
  patientId: number;
  date: string;
  text: string;
  createdAt: string;
  // Optional so rows from before note categories and doctor flags remain readable.
  category?: string;
  flaggedForDoctor?: boolean;
  flaggedPhysicianId?: number | null;
}

export interface NoteUpdate {
  id?: number;
  noteId: number;
  date: string;
  text: string;
  createdAt: string;
}

/**
 * One MedRecords Care log entry: a meal, a therapy session, a mood check,
 * an awareness check or a personal-care task. Fields not used by an entry's
 * kind stay undefined.
 */
export interface CareEntry {
  id?: number;
  patientId: number;
  /** When it happened, local time "YYYY-MM-DDTHH:mm" so days bucket by the clock on the wall. */
  at: string;
  kind: "meal" | "therapy" | "mood" | "awareness" | "personal";
  /** done / partial / declined. Mood and awareness checks are always "done". */
  status: "done" | "partial" | "declined";
  /** meal: breakfast | lunch | dinner | snack */
  meal?: string;
  /** meal: all | most | some | little */
  amount?: string | null;
  /** therapy: PT | OT */
  therapy?: string;
  minutes?: number | null;
  /** personal: bathing | dressing | toileting | grooming */
  task?: string;
  /** personal: none | some | full */
  help?: string | null;
  /** mood: 1-10 */
  score?: number | null;
  /** awareness level key */
  level?: string | null;
  /** Why it was declined (reason key). */
  reason?: string | null;
  /** What they ate, which exercises, etc. */
  details?: string | null;
  note?: string | null;
  /** First name of whoever logged it. */
  loggedBy?: string | null;
  createdAt: string;
  /** Cloud id for entries that came from a caregiver's phone (dedupe). */
  sourceId?: string | null;
}
