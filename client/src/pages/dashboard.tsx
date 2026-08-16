import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Pill, Stethoscope, FileText, HeartPulse, Phone, Clock, AlertCircle, Bell, Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import type { Appointment, Medication, Physician, MedicalRecord, Vital, EmergencyContact } from "@shared/schema";
import { usePatient } from "@/lib/patient-context";
import { getAppointments, getMedications, getPhysicians, getMedicalRecords, getVitals, getEmergencyContacts } from "@/lib/db";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { localTodayKey } from "@/lib/history-actions";

/** First word of a saved name, so the dashboard greeting stays first-name only. */
function firstNameOnly(fullName: string): string {
  return String(fullName || "").trim().split(/\s+/)[0] || "";
}

/** "Jamie" -> "Jamie's"; "Charles" -> "Charles'" for names already ending in s. */
function possessive(name: string): string {
  if (!name) return "";
  return name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`;
}

/** Small uppercase group heading, matching the full version. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
      {children}
    </h2>
  );
}

function StatCard({ title, value, icon: Icon, href }: {
  title: string; value: number; icon: any; href: string;
}) {
  return (
    <Link href={href} className="block h-full min-w-0">
      {/* Every tile gets the same neutral treatment; the accent is spent once per
          screen instead of on the tiles. Compact so the grid stays one short
          block near the top on a phone. */}
      <Card className="hover-elevate cursor-pointer h-full" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        <CardContent className="p-3 flex flex-col gap-2 min-w-0">
          <p className="text-sm font-body font-semibold leading-tight tracking-tight text-muted-foreground truncate">
            {title}
          </p>
          <div className="flex items-end justify-between gap-2 mt-auto min-w-0">
            <span className="text-2xl font-heading font-bold leading-none tabular-nums">{value}</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { activePatientId, activePatient } = usePatient();
  const pid = activePatientId;
  const { data: appointments = [] } = useQuery<Appointment[]>({ queryKey: ["appointments", pid], queryFn: () => getAppointments(pid) });
  const { data: medications = [] } = useQuery<Medication[]>({ queryKey: ["medications", pid], queryFn: () => getMedications(pid) });
  const { data: physicians = [] } = useQuery<Physician[]>({ queryKey: ["physicians", pid], queryFn: () => getPhysicians(pid) });
  const { data: records = [] } = useQuery<MedicalRecord[]>({ queryKey: ["medicalRecords", pid], queryFn: () => getMedicalRecords(pid) });
  const { data: vitals = [] } = useQuery<Vital[]>({ queryKey: ["vitals", pid], queryFn: () => getVitals(pid) });
  const { data: contacts = [] } = useQuery<EmergencyContact[]>({ queryKey: ["emergencyContacts", pid], queryFn: () => getEmergencyContacts(pid) });

  const today = localTodayKey();
  const upcoming = appointments.filter(
    (a) => a.status === "upcoming" && a.date >= today
  ).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  const activeMeds = medications.filter((m) => m.active === 1);
  const refillSoon = activeMeds.filter((m) => {
    if (!m.refillDate) return false;
    const refill = parseISO(m.refillDate);
    return isBefore(refill, addDays(new Date(), 7)) && isAfter(refill, addDays(new Date(), -1));
  });

  const reminderIds = new Set(
    appointments
      .filter((a) => a.reminderDate && a.status === "upcoming" && a.reminderDate <= today)
      .map((a) => a.id),
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl w-full min-w-0 overflow-x-hidden">
      <div>
        <h1 className="font-heading text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          {activePatient && firstNameOnly(activePatient.name)
            ? `${possessive(firstNameOnly(activePatient.name))} health overview`
            : "Your health overview at a glance"}
        </p>
      </div>

      {physicians.length === 0 && appointments.length === 0 && medications.length === 0 && records.length === 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-bold">Welcome to Medical Records Keeper</h2>
                <p className="text-xs text-muted-foreground mt-1.5 font-body leading-relaxed">
                  The best way to get started is to add your physicians first. Their names will then appear in dropdown menus when you add appointments, medications, and medical records.
                </p>
                <div className="mt-3 space-y-1.5">
                  <Link href="/physicians" className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline" data-testid="link-get-started-physicians">
                    <Stethoscope className="w-3.5 h-3.5" /> Step 1: Add your physicians <ChevronRight className="w-3 h-3" />
                  </Link>
                  <Link href="/appointments" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary hover:underline">
                    <CalendarDays className="w-3.5 h-3.5" /> Step 2: Schedule appointments
                  </Link>
                  <Link href="/medications" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary hover:underline">
                    <Pill className="w-3.5 h-3.5" /> Step 3: Add your medications
                  </Link>
                  <Link href="/records" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary hover:underline">
                    <FileText className="w-3.5 h-3.5" /> Step 4: Upload medical records
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Four most-used counts. Vitals and Emergency Contacts live in the menu
          only, matching the full version. */}
      <section className="space-y-3 min-w-0">
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-0">
          <StatCard title="Appointments" value={appointments.filter(a => a.status === "upcoming").length} icon={CalendarDays} href="/appointments" />
          <StatCard title="Active Meds" value={activeMeds.length} icon={Pill} href="/medications" />
          <StatCard title="Physicians" value={physicians.length} icon={Stethoscope} href="/physicians" />
          <StatCard title="Records" value={records.length} icon={FileText} href="/records" />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4 min-w-0">
        <Card className="min-w-0">
          <CardHeader className="pb-3 min-w-0">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-primary" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <div className="text-center py-6">
                <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <Link href="/appointments" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Schedule one
                </Link>
              </div>
            ) : (
              upcoming.map((apt) => {
                const doc = physicians.find((p) => p.id === apt.physicianId);
                const isReminder = reminderIds.has(apt.id);
                return (
                  <div key={apt.id} className={`flex items-center gap-3 p-2 rounded-md min-w-0 ${isReminder ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"}`} data-testid={`upcoming-apt-${apt.id}`}>
                    <div className="w-10 h-10 rounded-md gradient-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-heading font-bold">
                        {format(parseISO(apt.date), "dd")}
                      </span>
                    </div>
                    {/* Title gets the full row width; the type badge sits with the
                        meta line underneath so nothing has to truncate early. */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-semibold leading-snug break-words">{apt.title}</p>
                        {isReminder && <Bell className="w-3 h-3 text-primary flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 min-w-0 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {format(parseISO(apt.date), "MMM d")} at {apt.time}
                          {doc ? ` · ${doc.name}` : ""}
                        </p>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">{apt.type}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Refill Overview
              {refillSoon.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {refillSoon.length} due soon
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeMeds.length === 0 ? (
              <div className="text-center py-6">
                <Pill className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No active medications</p>
                <Link href="/medications" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Add medication
                </Link>
              </div>
            ) : refillSoon.length > 0 ? (
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-semibold">Refills Needed Soon</p>
                </div>
                {refillSoon.map((m) => (
                  <p key={m.id} className="text-xs text-amber-600 dark:text-amber-400/80 mt-1 ml-6" data-testid={`refill-${m.id}`}>
                    {m.name} — refill by {format(parseISO(m.refillDate!), "MMM d")}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">All refills up to date</p>
                  <p className="text-xs text-muted-foreground">
                    {activeMeds.length} active medication{activeMeds.length === 1 ? "" : "s"} · no refills due in the next 7 days
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading text-sm font-bold">Phone Reminders</h3>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Full version</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-body leading-relaxed">
                Get push notifications on your phone before appointments and when refills are due. Available in the full app once you add it to your Home Screen — no account or sign-in required.
              </p>
              <button
                type="button"
                disabled
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground cursor-not-allowed opacity-70"
                data-testid="button-phone-reminders-disabled"
                title="Phone reminders are available in the full version"
              >
                Enable phone reminders <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
