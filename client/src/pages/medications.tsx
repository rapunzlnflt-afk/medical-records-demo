import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getMedications, createMedication, updateMedication, deleteMedication, getMedicationLogs, createMedicationLog, getPhysicians } from "@/lib/db";
import { usePatient } from "@/lib/patient-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Pill, Plus, Trash2, Edit2, Clock, AlertCircle, CheckCircle2, Sunrise, Sun, Sunset, Moon, Printer, ExternalLink, Tag, ShieldAlert, ChevronDown, XCircle, MoreHorizontal, Archive } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Medication, MedicationLog, Physician } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { localTodayKey } from "@/lib/history-actions";
import { useLocation } from "wouter";

/**
 * A collapsible card holding a short list of outside links (interaction checkers,
 * discount programs). Starts closed so the medication list stays the focus, and the
 * whole header is the tap target.
 */
function LinkListCard({ title, icon: Icon, description, links, testIdPrefix }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  links: { name: string; url: string }[];
  testIdPrefix: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          data-testid={`button-toggle-${testIdPrefix}`}
        >
          <Icon className="h-5 w-5 flex-shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight">{title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
          </span>
          <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 px-4 pb-3 pl-12">
          {links.map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 rounded-md px-1.5 py-1.5 font-body text-sm text-primary transition-colors hover:bg-primary/5 hover:underline"
              data-testid={`link-${testIdPrefix}-${link.name.toLowerCase().replace(/\s+/g, "-")}`}>
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="min-w-0 break-words">{link.name}</span>
            </a>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const MED_TYPES = ["prescription", "otc", "supplement", "vitamin"];
const FREQUENCIES = ["daily", "twice-daily", "three-times-daily", "weekly", "bi-weekly", "monthly", "as-needed"];
const TIMES_OF_DAY = ["morning", "afternoon", "evening", "bedtime"];

const timeIcon = (t: string | null) => {
  if (t === "morning") return <Sunrise className="w-3 h-3" />;
  if (t === "afternoon") return <Sun className="w-3 h-3" />;
  if (t === "evening") return <Sunset className="w-3 h-3" />;
  if (t === "bedtime") return <Moon className="w-3 h-3" />;
  return <Clock className="w-3 h-3" />;
};

function MedicationForm({ initial, onSubmit, onCancel, physicians }: {
  initial?: Partial<Medication>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  physicians: Physician[];
}) {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    name: initial?.name || "",
    type: initial?.type || "prescription",
    dosage: initial?.dosage || "",
    frequency: initial?.frequency || "daily",
    timeOfDay: initial?.timeOfDay || "",
    prescribedBy: initial?.prescribedBy || "",
    pharmacy: initial?.pharmacy || "",
    startDate: initial?.startDate || "",
    endDate: initial?.endDate || "",
    refillDate: initial?.refillDate || "",
    purpose: initial?.purpose || "",
    sideEffects: initial?.sideEffects || "",
    notes: initial?.notes || "",
    active: initial?.active ?? 1,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-body">Medication Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lisinopril" data-testid="input-med-name" />
        </div>
        <div>
          <Label className="text-xs font-body">Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger data-testid="select-med-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MED_TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-body">Dosage</Label>
          <Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="10mg" data-testid="input-med-dosage" />
        </div>
        <div>
          <Label className="text-xs font-body">Frequency</Label>
          <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
            <SelectTrigger data-testid="select-med-freq"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-body">Time of Day</Label>
          <Select value={form.timeOfDay || "none"} onValueChange={(v) => setForm({ ...form, timeOfDay: v === "none" ? "" : v })}>
            <SelectTrigger data-testid="select-med-time"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {TIMES_OF_DAY.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-body">Prescribed By</Label>
          <Select value={form.prescribedBy || "none"} onValueChange={(v) => {
            if (v === "__add_physician__") {
              navigate("/physicians");
              return;
            }
            setForm({ ...form, prescribedBy: v === "none" ? "" : v });
          }}>
            <SelectTrigger data-testid="select-med-prescribed"><SelectValue placeholder="Select physician" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {physicians.map((p) => <SelectItem key={p.id} value={p.name}>{p.name} — {p.specialty}</SelectItem>)}
              <SelectItem value="__add_physician__" className="text-primary font-semibold">+ Add Physician</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-body">Pharmacy</Label>
          <Input value={form.pharmacy || ""} onChange={(e) => setForm({ ...form, pharmacy: e.target.value })} placeholder="CVS Main St" data-testid="input-med-pharmacy" />
        </div>
        <div>
          <Label className="text-xs font-body">Purpose</Label>
          <Input value={form.purpose || ""} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Blood pressure" data-testid="input-med-purpose" />
        </div>
        <div>
          <Label className="text-xs font-body">Start Date</Label>
          <Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value })} data-testid="input-med-start" />
        </div>
        <div>
          <Label className="text-xs font-body">End Date</Label>
          <Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} data-testid="input-med-end" />
        </div>
        <div>
          <Label className="text-xs font-body">Refill Date</Label>
          <Input type="date" value={form.refillDate || ""} onChange={(e) => setForm({ ...form, refillDate: e.target.value })} data-testid="input-med-refill" />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <Switch checked={form.active === 1} onCheckedChange={(c) => setForm({ ...form, active: c ? 1 : 0 })} data-testid="switch-med-active" />
          <Label className="text-xs font-body">Active</Label>
        </div>
      </div>
      <div>
        <Label className="text-xs font-body">Side Effects</Label>
        <Input value={form.sideEffects || ""} onChange={(e) => setForm({ ...form, sideEffects: e.target.value })} placeholder="Dizziness, cough..." data-testid="input-med-side" />
      </div>
      <div>
        <Label className="text-xs font-body">Notes</Label>
        <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} data-testid="input-med-notes" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onSubmit(form)} disabled={!form.name || !form.dosage}
          className="gradient-primary text-white border-none" data-testid="button-med-save">
          {initial?.id ? "Update" : "Add"} Medication
        </Button>
      </div>
    </div>
  );
}

export default function Medications() {
  const { activePatientId } = usePatient();
  const pid = activePatientId;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [logOpen, setLogOpen] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: medications = [], isLoading } = useQuery<Medication[]>({
    queryKey: ["medications", pid],
    queryFn: () => getMedications(pid),
  });
  const { data: logs = [] } = useQuery<MedicationLog[]>({
    queryKey: ["medication-logs"],
    queryFn: () => getMedicationLogs(),
  });
  const { data: physicians = [] } = useQuery<Physician[]>({
    queryKey: ["physicians", pid],
    queryFn: () => getPhysicians(pid),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => createMedication({ ...data, patientId: pid }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medications", pid] }); setOpen(false); toast({ title: "Medication added" }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateMedication(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medications", pid] }); setEditing(null); toast({ title: "Medication updated" }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMedication(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medications", pid] }); toast({ title: "Medication deleted" }); },
  });
  const logMut = useMutation({
    mutationFn: (data: any) => createMedicationLog(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medication-logs"] }); toast({ title: "Dose logged" }); },
  });

  const active = medications.filter((m) => m.active === 1);
  const inactive = medications.filter((m) => m.active !== 1);
  const today = localTodayKey();

  const logDose = (medId: number, taken: boolean) => {
    logMut.mutate({
      medicationId: medId,
      date: today,
      taken: taken ? 1 : 0,
      time: format(new Date(), "HH:mm"),
    });
  };

  function MedCard({ med }: { med: Medication }) {
    const medLogs = logs.filter((l) => l.medicationId === med.id);
    const todayLog = medLogs.find((l) => l.date === today);

    const meta = [med.dosage, med.type].filter(Boolean).join(" · ");
    const reference = [med.prescribedBy ? `Rx ${med.prescribedBy}` : null, med.pharmacy].filter(Boolean).join(" · ");

    return (
      <Card data-testid={`medication-${med.id}`}>
        <CardContent className="space-y-1 p-4">
          {/* Name, then one ⋯ menu (Edit, Delete), as in the full app. */}
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 py-1 font-heading text-base font-semibold leading-tight [overflow-wrap:anywhere] sm:text-lg">
              {med.name}
            </h3>
            <div className="-mr-2 -mt-1.5 flex shrink-0 items-center">
              <Dialog open={editing?.id === med.id} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle className="font-heading">Edit Medication</DialogTitle></DialogHeader>
                  <MedicationForm physicians={physicians} initial={med} onSubmit={(data) => updateMut.mutate({ id: med.id!, data })} onCancel={() => setEditing(null)} />
                </DialogContent>
              </Dialog>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-11 w-11 text-muted-foreground" aria-label={`More actions for ${med.name}`} data-testid={`button-med-menu-${med.id}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem]">
                  <DropdownMenuItem className="min-h-11 gap-2 text-base sm:text-sm" onSelect={() => setEditing(med)} data-testid={`button-edit-med-${med.id}`}>
                    <Edit2 className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="min-h-11 gap-2 text-base text-destructive focus:text-destructive sm:text-sm" onSelect={() => deleteMut.mutate(med.id!)} data-testid={`button-delete-med-${med.id}`}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* One plain line of facts: dosage, form and how often. */}
          <p className="text-sm text-muted-foreground">{[meta, med.frequency].filter(Boolean).join(" · ")}</p>

          {(med.purpose || reference) && (
            <p className="text-xs text-muted-foreground">{[med.purpose, reference].filter(Boolean).join(" · ")}</p>
          )}

          {med.refillDate && (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />Refill {format(parseISO(med.refillDate), "MMM d, yyyy")}
            </p>
          )}

          {med.active === 1 && (
            <div className="flex items-center gap-1 border-t border-border/50 pt-2">
              {todayLog ? (
                todayLog.taken ? (
                  <Badge className="status-completed h-9 px-3 text-xs font-semibold" data-testid={`badge-taken-${med.id}`}>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Taken
                  </Badge>
                ) : (
                  <Badge className="status-skipped h-9 px-3 text-xs font-semibold" data-testid={`badge-skipped-${med.id}`}>
                    <XCircle className="mr-1 h-3.5 w-3.5" />Skipped
                  </Badge>
                )
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => logDose(med.id!, true)} className="h-11 shrink-0 px-3 text-sm" data-testid={`button-take-${med.id}`}>
                    Take
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => logDose(med.id!, false)} className="h-11 shrink-0 px-2.5 text-sm text-muted-foreground" data-testid={`button-skip-${med.id}`}>
                    Skip
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-xl font-bold">Medications</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Track prescriptions, supplements, and daily doses</p>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button size="sm" variant="outline" className="gap-1 opacity-50 cursor-not-allowed" disabled data-testid="button-print-medications">
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Disabled in demo</TooltipContent>
          </Tooltip>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-white border-none gap-1" data-testid="button-add-medication">
                <Plus className="w-4 h-4" /> Add Medication
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">New Medication</DialogTitle></DialogHeader>
            <MedicationForm physicians={physicians} onSubmit={(data) => createMut.mutate(data)} onCancel={() => setOpen(false)} />
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* One list, as in the full app: each card shows today's dose, and
          archived medications sit in a collapsed row underneath. */}
      <section className="space-y-3" aria-label="Your medications">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : active.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Pill className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No active medications</p>
          </CardContent></Card>
        ) : active.map((med) => <MedCard key={med.id} med={med} />)}
        {inactive.length > 0 && (
          <Collapsible open={showArchived} onOpenChange={setShowArchived}>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex min-h-11 w-full items-center gap-2 rounded-md px-1 text-left text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="button-toggle-archived">
                <Archive className="h-4 w-4" />
                Archived ({inactive.length})
                <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-1">
              {inactive.map((med) => <MedCard key={med.id} med={med} />)}
            </CollapsibleContent>
          </Collapsible>
        )}
      </section>

      {/* Extras in one quiet grouped list, all collapsed. */}
      <section className="space-y-2" aria-labelledby="more-tools-heading">
        <h2 id="more-tools-heading" className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">More tools</h2>
        <Card className="divide-y divide-border/60 overflow-hidden">
        <LinkListCard
          title="Drug interaction checkers"
          icon={ShieldAlert}
          description="Check whether your medications interact"
          testIdPrefix="interaction"
          links={[
            { name: "Drugs.com Interaction Checker", url: "https://www.drugs.com/drug_interactions.html" },
            { name: "WebMD Interaction Checker", url: "https://www.webmd.com/interaction-checker/default.htm" },
            { name: "Medscape Drug Interaction Checker", url: "https://reference.medscape.com/drug-interactionchecker" },
            { name: "RxList Interaction Checker", url: "https://www.rxlist.com/drug-interaction-checker.htm" },
          ]}
        />
        <LinkListCard
          title="Prescription discounts"
          icon={Tag}
          description="Ways to pay less for prescriptions"
          testIdPrefix="discount"
          links={[
            { name: "GoodRx", url: "https://www.goodrx.com" },
            { name: "RxSaver by RetailMeNot", url: "https://www.rxsaver.com" },
            { name: "NeedyMeds", url: "https://www.needymeds.org" },
            { name: "RxAssist", url: "https://www.rxassist.org" },
            { name: "Medicare Extra Help", url: "https://www.ssa.gov/medicare/part-d-extra-help" },
          ]}
        />
        </Card>
      </section>
    </div>
  );
}
