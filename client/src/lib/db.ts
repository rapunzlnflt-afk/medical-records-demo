import Dexie, { type Table } from "dexie";
import type {
  Patient, Physician, Appointment, Medication, MedicationLog,
  MedicalRecord, Vital, EmergencyContact, Pharmacy, Note, NoteUpdate,
} from "@shared/schema";
import {
  SAMPLE_DENTAL_CARD_BACK, SAMPLE_DENTAL_CARD_FRONT,
  SAMPLE_MEDICAL_CARD_BACK, SAMPLE_MEDICAL_CARD_FRONT,
} from "./demo-cards";

class MedicalRecordsDB extends Dexie {
  patients!: Table<Patient, number>;
  physicians!: Table<Physician, number>;
  appointments!: Table<Appointment, number>;
  medications!: Table<Medication, number>;
  medicationLogs!: Table<MedicationLog, number>;
  medicalRecords!: Table<MedicalRecord, number>;
  vitals!: Table<Vital, number>;
  emergencyContacts!: Table<EmergencyContact, number>;
  pharmacies!: Table<Pharmacy, number>;
  notes!: Table<Note, number>;
  noteUpdates!: Table<NoteUpdate, number>;

  constructor() {
    super("MedicalRecordsKeeper");
    this.version(1).stores({
      patients: "++id",
      physicians: "++id, patientId",
      appointments: "++id, patientId",
      medications: "++id, patientId",
      medicationLogs: "++id, medicationId",
      medicalRecords: "++id, patientId",
      vitals: "++id, patientId",
      emergencyContacts: "++id, patientId",
      pharmacies: "++id, patientId",
    });

    // This migration only adds note stores. Existing stores and their indexes are
    // declared exactly as version 1 so an upgrade never rewrites local rows.
    this.version(2).stores({
      patients: "++id",
      physicians: "++id, patientId",
      appointments: "++id, patientId",
      medications: "++id, patientId",
      medicationLogs: "++id, medicationId",
      medicalRecords: "++id, patientId",
      vitals: "++id, patientId",
      emergencyContacts: "++id, patientId",
      pharmacies: "++id, patientId",
      notes: "++id, patientId, date, flaggedForDoctor",
      noteUpdates: "++id, noteId, date",
    });
  }
}

export const db = new MedicalRecordsDB();

/**
 * Seed the demo patient if the DB is empty. main.tsx drops the whole database on
 * every page load, so this runs on each refresh and the demo always starts from
 * the same fictional sample data.
 */
export async function ensureDemoData(): Promise<void> {
  const count = await db.patients.count();
  if (count > 0) return;

  const patientId = await db.patients.add({
    name: "Jamie Rivera",
    relationship: "Self",
    dateOfBirth: "1985-04-12",
    color: "#3b82f6",
    bloodType: "O+",
    height: `5'7"`,
    allergies: "Penicillin (hives), shellfish",
    conditions: "Seasonal asthma — rescue inhaler as needed",
    insuranceCardFront: SAMPLE_MEDICAL_CARD_FRONT,
    insuranceCardBack: SAMPLE_MEDICAL_CARD_BACK,
    insuranceCarrier: "Northwind Mutual Health",
    insurancePlanType: "PPO Family",
    insuranceMemberId: "SMPL-0123-4567",
    insuranceGroupNumber: "SAMPLE-0001",
    insuranceRxBin: "009999",
    insuranceRxPcn: "SMPLPCN",
    insuranceRxGroup: "NWSMP01",
    insurancePhone: "(555) 018-2400",
    insurancePolicyHolder: "Jamie Rivera",
    insuranceEffectiveDate: "2026-01-01",
    dentalCardFront: SAMPLE_DENTAL_CARD_FRONT,
    dentalCardBack: SAMPLE_DENTAL_CARD_BACK,
    dentalCarrier: "Silverpine Dental Guild",
    dentalPlanType: "DPPO Family",
    dentalMemberId: "SMPL-DEN-7788",
    dentalGroupNumber: "SAMPLE-D002",
    dentalPhone: "(555) 019-3300",
    dentalPolicyHolder: "Jamie Rivera",
    dentalEffectiveDate: "2026-01-01",
  });

  const physicianId = await db.physicians.add({
    patientId,
    name: "Dr. Elena Ramirez",
    specialty: "Family Medicine",
    phone: "(555) 018-3100",
    fax: null,
    email: "office@cedarpark.example",
    website: "cedarparkfamily.example",
    address: "820 Cedar Park Way",
    city: "Springfield",
    state: "ST",
    zip: "00000",
    npi: null,
    notes: null,
  });

  await db.patients.update(patientId, { primaryPhysicianId: physicianId });

  await db.appointments.bulkAdd([
    {
      patientId, physicianId, title: "Annual wellness visit", date: "2026-08-20", time: "09:30",
      location: "Cedar Park Family Clinic", type: "Checkup", status: "upcoming",
      notes: "Routine annual visit.", reminderDate: "2026-08-19",
    },
    {
      patientId, physicianId, title: "Spring medication review", date: "2026-05-14", time: "14:00",
      location: "Cedar Park Family Clinic", type: "Follow-up", status: "completed",
      notes: "Reviewed seasonal asthma plan.", reminderDate: null,
    },
  ]);

  const hydrationNoteId = await db.notes.add({
    patientId, date: "2026-08-06", category: "Symptom",
    text: "Noticed a mild scratchy throat after spending time outdoors. Rest and warm tea helped.",
    flaggedForDoctor: true, flaggedPhysicianId: physicianId, createdAt: "2026-08-06T19:15:00",
  });
  await db.noteUpdates.add({
    noteId: hydrationNoteId, date: "2026-08-08",
    text: "Feeling back to normal; no further symptoms after two days.", createdAt: "2026-08-08T18:30:00",
  });
  await db.notes.bulkAdd([
    {
      patientId, date: "2026-08-02", category: "Sleep",
      text: "Slept lightly after a late cup of coffee. Returned to the usual schedule the next night.",
      flaggedForDoctor: false, flaggedPhysicianId: null, createdAt: "2026-08-02T20:45:00",
    },
    {
      patientId, date: "2026-07-28", category: "Appetite / diet",
      text: "Packed lunches more often this week and felt more energized in the afternoon.",
      flaggedForDoctor: false, flaggedPhysicianId: null, createdAt: "2026-07-28T12:10:00",
    },
  ]);
}

// ==================== CRUD helpers ====================

// --- Patients ---
export async function getPatients(): Promise<Patient[]> {
  return db.patients.toArray();
}
export async function getPatient(id: number): Promise<Patient | undefined> {
  return db.patients.get(id);
}
export async function createPatient(data: Omit<Patient, "id">): Promise<Patient> {
  const id = await db.patients.add(data as Patient);
  return { ...data, id } as Patient;
}
export async function updatePatient(id: number, data: Partial<Patient>): Promise<Patient> {
  await db.patients.update(id, data);
  return (await db.patients.get(id))!;
}
export async function deletePatient(id: number): Promise<void> {
  // Cascade delete all related data
  await db.pharmacies.where("patientId").equals(id).delete();
  await db.emergencyContacts.where("patientId").equals(id).delete();
  await db.vitals.where("patientId").equals(id).delete();
  await db.medicalRecords.where("patientId").equals(id).delete();
  const meds = await db.medications.where("patientId").equals(id).toArray();
  for (const med of meds) {
    if (med.id) await db.medicationLogs.where("medicationId").equals(med.id).delete();
  }
  await db.medications.where("patientId").equals(id).delete();
  await db.appointments.where("patientId").equals(id).delete();
  const notes = await db.notes.where("patientId").equals(id).toArray();
  const noteIds = notes.flatMap((note) => note.id === undefined ? [] : [note.id]);
  if (noteIds.length > 0) await db.noteUpdates.where("noteId").anyOf(noteIds).delete();
  await db.notes.where("patientId").equals(id).delete();
  await db.physicians.where("patientId").equals(id).delete();
  await db.patients.delete(id);
}

// --- Physicians ---
export async function getPhysicians(patientId: number): Promise<Physician[]> {
  return db.physicians.where("patientId").equals(patientId).toArray();
}
export async function getPhysician(id: number): Promise<Physician | undefined> {
  return db.physicians.get(id);
}
export async function createPhysician(data: Omit<Physician, "id">): Promise<Physician> {
  const id = await db.physicians.add(data as Physician);
  return { ...data, id } as Physician;
}
export async function updatePhysician(id: number, data: Partial<Physician>): Promise<Physician> {
  await db.physicians.update(id, data);
  return (await db.physicians.get(id))!;
}
export async function deletePhysician(id: number): Promise<void> {
  await db.physicians.delete(id);
}

// --- Appointments ---
export async function getAppointments(patientId: number): Promise<Appointment[]> {
  const list = await db.appointments.where("patientId").equals(patientId).toArray();
  return list.sort((a, b) => b.date.localeCompare(a.date));
}
export async function getAppointment(id: number): Promise<Appointment | undefined> {
  return db.appointments.get(id);
}
export async function createAppointment(data: Omit<Appointment, "id">): Promise<Appointment> {
  const id = await db.appointments.add(data as Appointment);
  return { ...data, id } as Appointment;
}
export async function updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment> {
  await db.appointments.update(id, data);
  return (await db.appointments.get(id))!;
}
export async function deleteAppointment(id: number): Promise<void> {
  await db.appointments.delete(id);
}

export const NOTE_CATEGORIES = [
  "Observation", "Symptom", "Injury", "Illness", "Medication reaction",
  "Behavior / mood", "Appetite / diet", "Sleep", "Digestion", "Skin", "Other",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export function noteCategory(note: Pick<Note, "category">): NoteCategory {
  return NOTE_CATEGORIES.includes(note.category as NoteCategory) ? note.category as NoteCategory : "Observation";
}

export function noteIsFlaggedForDoctor(note: Pick<Note, "flaggedForDoctor">): boolean {
  return note.flaggedForDoctor === true;
}

export async function getNotes(patientId: number): Promise<Note[]> {
  const list = await db.notes.where("patientId").equals(patientId).toArray();
  return list.map((note) => ({ ...note, category: noteCategory(note), flaggedForDoctor: noteIsFlaggedForDoctor(note), flaggedPhysicianId: note.flaggedPhysicianId ?? null }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function createNote(data: Omit<Note, "id">): Promise<Note> {
  const flaggedForDoctor = noteIsFlaggedForDoctor(data);
  const note: Note = { ...data, category: noteCategory(data), flaggedForDoctor, flaggedPhysicianId: flaggedForDoctor && typeof data.flaggedPhysicianId === "number" ? data.flaggedPhysicianId : null };
  const id = await db.notes.add(note);
  return { ...note, id };
}

export async function updateNote(id: number, data: Partial<Note>): Promise<Note> {
  await db.notes.update(id, data);
  return (await db.notes.get(id))!;
}

export async function deleteNote(id: number): Promise<void> {
  await db.transaction("rw", db.notes, db.noteUpdates, async () => {
    await db.noteUpdates.where("noteId").equals(id).delete();
    await db.notes.delete(id);
  });
}

export async function getNoteUpdates(noteIds: number[]): Promise<NoteUpdate[]> {
  if (noteIds.length === 0) return [];
  return (await db.noteUpdates.where("noteId").anyOf(noteIds).toArray())
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

export async function createNoteUpdate(data: Omit<NoteUpdate, "id">): Promise<NoteUpdate> {
  const id = await db.noteUpdates.add(data as NoteUpdate);
  return { ...data, id };
}

export async function updateNoteUpdate(id: number, data: Partial<NoteUpdate>): Promise<NoteUpdate> {
  await db.noteUpdates.update(id, data);
  return (await db.noteUpdates.get(id))!;
}

export async function deleteNoteUpdate(id: number): Promise<void> {
  await db.noteUpdates.delete(id);
}

// --- Medications ---
export async function getMedications(patientId: number): Promise<Medication[]> {
  return db.medications.where("patientId").equals(patientId).toArray();
}
export async function getMedication(id: number): Promise<Medication | undefined> {
  return db.medications.get(id);
}
export async function createMedication(data: Omit<Medication, "id">): Promise<Medication> {
  const id = await db.medications.add(data as Medication);
  return { ...data, id } as Medication;
}
export async function updateMedication(id: number, data: Partial<Medication>): Promise<Medication> {
  await db.medications.update(id, data);
  return (await db.medications.get(id))!;
}
export async function deleteMedication(id: number): Promise<void> {
  await db.medicationLogs.where("medicationId").equals(id).delete();
  await db.medications.delete(id);
}

// --- Medication Logs ---
export async function getMedicationLogs(medicationId?: number): Promise<MedicationLog[]> {
  if (medicationId) {
    const list = await db.medicationLogs.where("medicationId").equals(medicationId).toArray();
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }
  const list = await db.medicationLogs.toArray();
  return list.sort((a, b) => b.date.localeCompare(a.date));
}
export async function createMedicationLog(data: Omit<MedicationLog, "id">): Promise<MedicationLog> {
  const id = await db.medicationLogs.add(data as MedicationLog);
  return { ...data, id } as MedicationLog;
}
export async function deleteMedicationLog(id: number): Promise<void> {
  await db.medicationLogs.delete(id);
}

// --- Medical Records ---
export async function getMedicalRecords(patientId: number): Promise<MedicalRecord[]> {
  const list = await db.medicalRecords.where("patientId").equals(patientId).toArray();
  return list.sort((a, b) => b.date.localeCompare(a.date));
}
export async function getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
  return db.medicalRecords.get(id);
}
export async function createMedicalRecord(data: Omit<MedicalRecord, "id">): Promise<MedicalRecord> {
  const id = await db.medicalRecords.add(data as MedicalRecord);
  return { ...data, id } as MedicalRecord;
}
export async function updateMedicalRecord(id: number, data: Partial<MedicalRecord>): Promise<MedicalRecord> {
  await db.medicalRecords.update(id, data);
  return (await db.medicalRecords.get(id))!;
}
export async function deleteMedicalRecord(id: number): Promise<void> {
  await db.medicalRecords.delete(id);
}

// --- Vitals ---
export async function getVitals(patientId: number): Promise<Vital[]> {
  const list = await db.vitals.where("patientId").equals(patientId).toArray();
  return list.sort((a, b) => b.date.localeCompare(a.date));
}
export async function createVital(data: Omit<Vital, "id">): Promise<Vital> {
  const id = await db.vitals.add(data as Vital);
  return { ...data, id } as Vital;
}
export async function deleteVital(id: number): Promise<void> {
  await db.vitals.delete(id);
}

// --- Emergency Contacts ---
export async function getEmergencyContacts(patientId: number): Promise<EmergencyContact[]> {
  return db.emergencyContacts.where("patientId").equals(patientId).toArray();
}
export async function createEmergencyContact(data: Omit<EmergencyContact, "id">): Promise<EmergencyContact> {
  const id = await db.emergencyContacts.add(data as EmergencyContact);
  return { ...data, id } as EmergencyContact;
}
export async function updateEmergencyContact(id: number, data: Partial<EmergencyContact>): Promise<EmergencyContact> {
  await db.emergencyContacts.update(id, data);
  return (await db.emergencyContacts.get(id))!;
}
export async function deleteEmergencyContact(id: number): Promise<void> {
  await db.emergencyContacts.delete(id);
}

// --- Pharmacies ---
export async function getPharmacies(patientId: number): Promise<Pharmacy[]> {
  return db.pharmacies.where("patientId").equals(patientId).toArray();
}
export async function getPharmacy(id: number): Promise<Pharmacy | undefined> {
  return db.pharmacies.get(id);
}
export async function createPharmacy(data: Omit<Pharmacy, "id">): Promise<Pharmacy> {
  const id = await db.pharmacies.add(data as Pharmacy);
  return { ...data, id } as Pharmacy;
}
export async function updatePharmacy(id: number, data: Partial<Pharmacy>): Promise<Pharmacy> {
  await db.pharmacies.update(id, data);
  return (await db.pharmacies.get(id))!;
}
export async function deletePharmacy(id: number): Promise<void> {
  await db.pharmacies.delete(id);
}

// ==================== Backup ====================
export async function exportAllData() {
  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    patients: await db.patients.toArray(),
    physicians: await db.physicians.toArray(),
    appointments: await db.appointments.toArray(),
    medications: await db.medications.toArray(),
    medicationLogs: await db.medicationLogs.toArray(),
    medicalRecords: await db.medicalRecords.toArray(),
    vitals: await db.vitals.toArray(),
    emergencyContacts: await db.emergencyContacts.toArray(),
    pharmacies: await db.pharmacies.toArray(),
    notes: await db.notes.toArray(),
    noteUpdates: await db.noteUpdates.toArray(),
  };
}

export async function importAllData(data: any): Promise<void> {
  // Clear everything
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });

  // Import patients (or create default for v1 backups)
  const patientIdMap: Record<number, number> = {};
  if (data.patients?.length) {
    for (const p of data.patients) {
      const oldId = p.id;
      const { id, ...rest } = p;
      const newId = await db.patients.add(rest);
      patientIdMap[oldId] = newId;
    }
  } else {
    const newId = await db.patients.add({ name: "My Records", relationship: "Self", dateOfBirth: null, color: "#3b82f6" });
    patientIdMap[1] = newId;
  }

  // Import physicians
  const physicianIdMap: Record<number, number> = {};
  if (data.physicians?.length) {
    for (const p of data.physicians) {
      const oldId = p.id;
      const { id, ...rest } = p;
      rest.patientId = patientIdMap[rest.patientId] || patientIdMap[1] || 1;
      const newId = await db.physicians.add(rest);
      physicianIdMap[oldId] = newId;
    }
  }

  // Import appointments
  if (data.appointments?.length) {
    for (const a of data.appointments) {
      const { id, ...rest } = a;
      if (rest.physicianId && physicianIdMap[rest.physicianId]) {
        rest.physicianId = physicianIdMap[rest.physicianId];
      }
      rest.patientId = patientIdMap[rest.patientId] || patientIdMap[1] || 1;
      await db.appointments.add(rest);
    }
  }

  // Import medications
  const medicationIdMap: Record<number, number> = {};
  if (data.medications?.length) {
    for (const m of data.medications) {
      const oldId = m.id;
      const { id, ...rest } = m;
      rest.patientId = patientIdMap[rest.patientId] || patientIdMap[1] || 1;
      const newId = await db.medications.add(rest);
      medicationIdMap[oldId] = newId;
    }
  }

  // Import medication logs
  if (data.medicationLogs?.length) {
    for (const l of data.medicationLogs) {
      const { id, ...rest } = l;
      if (rest.medicationId && medicationIdMap[rest.medicationId]) {
        rest.medicationId = medicationIdMap[rest.medicationId];
      }
      await db.medicationLogs.add(rest);
    }
  }

  // Import medical records
  if (data.medicalRecords?.length) {
    for (const r of data.medicalRecords) {
      const { id, ...rest } = r;
      if (rest.physicianId && physicianIdMap[rest.physicianId]) {
        rest.physicianId = physicianIdMap[rest.physicianId];
      }
      rest.patientId = patientIdMap[rest.patientId] || patientIdMap[1] || 1;
      await db.medicalRecords.add(rest);
    }
  }

  // Import vitals
  if (data.vitals?.length) {
    for (const v of data.vitals) {
      const { id, ...rest } = v;
      rest.patientId = patientIdMap[rest.patientId] || patientIdMap[1] || 1;
      await db.vitals.add(rest);
    }
  }

  // Import emergency contacts
  if (data.emergencyContacts?.length) {
    for (const c of data.emergencyContacts) {
      const { id, ...rest } = c;
      rest.patientId = patientIdMap[rest.patientId] || patientIdMap[1] || 1;
      await db.emergencyContacts.add(rest);
    }
  }

  // Import pharmacies
  if (data.pharmacies?.length) {
    for (const p of data.pharmacies) {
      const { id, ...rest } = p;
      rest.patientId = patientIdMap[rest.patientId] || patientIdMap[1] || 1;
      await db.pharmacies.add(rest);
    }
  }

  // Import notes before their follow-ups so reassigned IDs remain linked. Missing
  // feature fields are intentionally left absent and read as safe defaults.
  const noteIdMap: Record<number, number> = {};
  if (data.notes?.length) {
    for (const note of data.notes) {
      const oldId = note.id;
      const { id, ...rest } = note;
      rest.patientId = patientIdMap[rest.patientId] || patientIdMap[1] || 1;
      rest.flaggedPhysicianId = rest.flaggedPhysicianId && physicianIdMap[rest.flaggedPhysicianId]
        ? physicianIdMap[rest.flaggedPhysicianId] : null;
      const newId = await db.notes.add(rest);
      if (typeof oldId === "number") noteIdMap[oldId] = newId;
    }
  }
  if (data.noteUpdates?.length) {
    for (const update of data.noteUpdates) {
      const { id, ...rest } = update;
      const remappedNoteId = noteIdMap[rest.noteId];
      if (remappedNoteId) await db.noteUpdates.add({ ...rest, noteId: remappedNoteId });
    }
  }
}
