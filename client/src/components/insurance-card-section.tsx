import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Camera, Edit2, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { fileToStorableDataUrl, IMAGE_READ_ERROR, IMAGE_UPLOAD_ACCEPT } from "@/lib/image";
import { formatPersonName } from "@/lib/format-name";
import { formatPhone } from "@/lib/format-phone";
import { blankToNull } from "@/lib/utils";

// Viewer sits above the demo's promo banners (z-index 9999) via the shared
// DialogContent, which carries the z-modal token.
const VIEWER_DIALOG_CLASS =
  "p-0 gap-0 max-w-none w-screen h-[100dvh] max-h-[100dvh] rounded-none border-0 left-0 right-0 top-0 translate-x-0 translate-y-0 " +
  "sm:left-0 sm:right-0 sm:top-0 sm:w-screen sm:max-w-none sm:translate-x-0 sm:translate-y-0 sm:rounded-none sm:p-0 " +
  "overflow-hidden flex flex-col bg-black text-white";

export type CardField<K extends string = string> = {
  /** Suffix for the input id and testid: "carrier" with prefix "ins" -> input-ins-carrier. */
  name: string;
  /** Property on the patient record this field reads from and writes to. */
  key: K;
  label: string;
  placeholder?: string;
  date?: boolean;
  /** Serial-number-ish field: don't let the keyboard autocapitalise or autocorrect it. */
  code?: boolean;
  phone?: boolean;
  personName?: boolean;
};

export type CardFormSection<K extends string = string> = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  fields: CardField<K>[];
};

/** Read the current value of every field in `sections` off a patient record. */
export function cardFieldValues<T extends object>(
  source: T,
  sections: CardFormSection<Extract<keyof T, string>>[],
): Record<string, string> {
  const record = source as Record<string, unknown>;
  return Object.fromEntries(
    sections
      .flatMap((s) => s.fields)
      .map((f) => [f.name, (record[f.key] as string | null | undefined) || ""]),
  );
}

type Draft = {
  front: string | null;
  back: string | null;
  fields: Record<string, string>;
};

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-body font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-base font-body mt-0.5 break-words">{value}</dd>
    </div>
  );
}

function FullScreenImage({ src, title, testIdPrefix, onClose }: {
  src: string;
  title: string;
  testIdPrefix: string;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={VIEWER_DIALOG_CLASS}>
        <DialogHeader className="px-4 py-3 text-left shrink-0 border-b border-white/15">
          <DialogTitle className="font-heading text-base font-semibold text-white pr-8">{title}</DialogTitle>
          <DialogDescription className="text-white/70 text-xs">
            Show this at the check-in desk. Tap the image to zoom.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto overscroll-contain">
          <div className="min-w-full min-h-full flex items-center justify-center p-2">
            <img
              src={src}
              alt={title}
              onClick={() => setZoomed((z) => !z)}
              className={zoomed ? "max-w-none w-[220%] cursor-zoom-out" : "max-w-full max-h-full object-contain cursor-zoom-in"}
              data-testid={`image-${testIdPrefix}-fullscreen`}
            />
          </div>
        </div>
        <div
          className="shrink-0 border-t border-white/15 px-4 py-3 flex gap-2 justify-center"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <Button
            variant="outline"
            onClick={() => setZoomed((z) => !z)}
            className="h-12 flex-1 max-w-[200px] text-base bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
            data-testid={`button-${testIdPrefix}-zoom`}
          >
            {zoomed ? <ZoomOut className="w-5 h-5 mr-1.5" /> : <ZoomIn className="w-5 h-5 mr-1.5" />}
            {zoomed ? "Fit to screen" : "Zoom in"}
          </Button>
          <Button
            onClick={onClose}
            className="h-12 flex-1 max-w-[200px] text-base font-semibold gradient-primary text-white border-none"
            data-testid={`button-${testIdPrefix}-close`}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_TILE_CLASS =
  "w-full aspect-[1.586] min-h-[104px] rounded-lg border-2 border-dashed border-muted-foreground/30 " +
  "flex flex-col items-center justify-center gap-1.5 px-2 text-center";

/**
 * One face of a card. Read-only in view mode — the whole tile is a button that
 * opens the viewer. In edit mode the image is inert and replace/remove sit
 * below it, so the destructive control can never be hit while just browsing.
 */
function CardPhotoTile({ label, value, editing, onChange, onRequestRemove, onView, testId }: {
  label: string;
  value: string | null | undefined;
  editing: boolean;
  onChange: (dataUrl: string) => void;
  onRequestRemove: () => void;
  onView: () => void;
  testId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await fileToStorableDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : IMAGE_READ_ERROR);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-sm font-body font-semibold">{label}</p>

      {value ? (
        editing ? (
          <div className="rounded-lg border overflow-hidden bg-muted/30" data-testid={`tile-editing-${testId}`}>
            <img src={value} alt={label} className="w-full aspect-[1.586] object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onView}
            className="block w-full aspect-[1.586] rounded-lg border overflow-hidden bg-muted/30"
            data-testid={`button-view-${testId}`}
          >
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </button>
        )
      ) : editing ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`${EMPTY_TILE_CLASS} hover:bg-muted/30 transition-colors`}
          data-testid={`button-add-${testId}`}
        >
          <Camera className="w-6 h-6 text-muted-foreground/60" />
          <span className="text-xs font-body text-muted-foreground leading-tight">
            {busy ? "Processing…" : "Take or choose a photo"}
          </span>
        </button>
      ) : (
        <div className={EMPTY_TILE_CLASS} data-testid={`tile-empty-${testId}`}>
          <Camera className="w-6 h-6 text-muted-foreground/60" />
          <span className="text-xs font-body text-muted-foreground leading-tight">No photo yet</span>
        </div>
      )}

      {editing && value && (
        <div className="space-y-1.5">
          <Button
            type="button" size="sm" variant="outline" className="w-full h-9 gap-1.5"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label={`Replace ${label}`}
            data-testid={`button-replace-${testId}`}
          >
            <Camera className="w-3.5 h-3.5" /> {busy ? "Processing…" : "Replace"}
          </Button>
          <Button
            type="button" size="sm" variant="outline" className="w-full h-9 gap-1.5 text-destructive hover:text-destructive"
            onClick={onRequestRemove}
            aria-label={`Remove ${label}`}
            data-testid={`button-remove-${testId}`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        onChange={handleFile}
        className="hidden"
        disabled={!editing}
        data-testid={`input-${testId}`}
      />
      {error && <p className="text-xs text-destructive break-words">{error}</p>}
    </div>
  );
}

/**
 * One insurance card as a single editable unit: front/back photos, a
 * full-screen viewer, and the typed plan details. Rendered once for medical and
 * once for dental — the two differ only in copy, testid prefix, and fields.
 *
 * Edit mode works entirely on a local draft. Nothing reaches IndexedDB until
 * Save, so Cancel restores a removed or replaced photo byte for byte.
 */
export function InsuranceCardSection({
  icon: Icon, title, description, viewerNoun, photoNoun, tileTestIdPrefix, idPrefix,
  editTestId, saveTestId, cancelTestId,
  front, back, frontKey, backKey,
  formSections, fieldValues, details, emptyHint, onSave, isSaving,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  /** Prefixes the viewer dialog title, e.g. "Medical card" -> "Medical card — front". */
  viewerNoun: string;
  /** Names the card in the remove confirmation, e.g. "your medical card". */
  photoNoun: string;
  tileTestIdPrefix: string;
  /** Prefixes the field input ids and testids, e.g. "ins" -> input-ins-carrier. */
  idPrefix: string;
  editTestId: string;
  saveTestId: string;
  cancelTestId: string;
  front: string | null | undefined;
  back: string | null | undefined;
  frontKey: string;
  backKey: string;
  formSections: CardFormSection[];
  fieldValues: Record<string, string>;
  details: { label: string; value: React.ReactNode }[];
  emptyHint: string;
  onSave: (data: Record<string, string | null>) => void;
  isSaving?: boolean;
}) {
  const [viewing, setViewing] = useState<"front" | "back" | null>(null);
  const [snapshot, setSnapshot] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<"front" | "back" | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const editButtonRef = useRef<HTMLButtonElement>(null);
  const editRegionRef = useRef<HTMLDivElement>(null);
  // Focus belongs on the Edit button after leaving edit mode, but not on first
  // paint — only once the user has actually been in the form.
  const returnFocus = useRef(false);

  const editing = draft !== null;
  const fields = formSections.flatMap((s) => s.fields);
  const hasDetails = details.some((d) => d.value !== null && d.value !== undefined && d.value !== "");

  useEffect(() => {
    if (editing) editRegionRef.current?.focus();
    else if (returnFocus.current) editButtonRef.current?.focus();
  }, [editing]);

  const isDirty =
    draft !== null && snapshot !== null &&
    (draft.front !== snapshot.front ||
      draft.back !== snapshot.back ||
      fields.some((f) => draft.fields[f.name] !== snapshot.fields[f.name]));

  const startEditing = () => {
    const fresh: Draft = { front: front ?? null, back: back ?? null, fields: { ...fieldValues } };
    returnFocus.current = true;
    setSnapshot(fresh);
    setDraft({ ...fresh, fields: { ...fresh.fields } });
  };

  const leaveEditing = () => {
    setDraft(null);
    setSnapshot(null);
    setConfirmRemove(null);
    setConfirmDiscard(false);
  };

  const handleCancel = () => {
    if (isDirty) setConfirmDiscard(true);
    else leaveEditing();
  };

  const handleSave = () => {
    if (!draft) return;
    const data: Record<string, string | null> = {
      [frontKey]: draft.front,
      [backKey]: draft.back,
    };
    for (const f of fields) {
      const raw = draft.fields[f.name] ?? "";
      data[f.key] = f.personName && raw.trim() ? formatPersonName(raw.trim()) : blankToNull(raw);
    }
    onSave(data);
    leaveEditing();
  };

  const setPhoto = (side: "front" | "back", dataUrl: string | null) =>
    setDraft((d) => (d ? { ...d, [side]: dataUrl } : d));

  const shownFront = editing ? draft.front : front;
  const shownBack = editing ? draft.back : back;
  const viewingSrc = viewing === "front" ? shownFront : shownBack;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-semibold leading-tight">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        <div
          ref={editRegionRef}
          tabIndex={editing ? -1 : undefined}
          role={editing ? "group" : undefined}
          aria-label={editing ? `Editing ${title}` : undefined}
          className="space-y-4 focus:outline-none min-w-0"
        >
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <CardPhotoTile
              label="Front"
              value={shownFront}
              editing={editing}
              onChange={(url) => setPhoto("front", url)}
              onRequestRemove={() => setConfirmRemove("front")}
              onView={() => setViewing("front")}
              testId={`${tileTestIdPrefix}-front`}
            />
            <CardPhotoTile
              label="Back"
              value={shownBack}
              editing={editing}
              onChange={(url) => setPhoto("back", url)}
              onRequestRemove={() => setConfirmRemove("back")}
              onView={() => setViewing("back")}
              testId={`${tileTestIdPrefix}-back`}
            />
          </div>

          {editing ? (
            <div className="border-t pt-4 space-y-5 min-w-0" data-testid={`form-${idPrefix}`}>
              {formSections.map((section) => (
                <div key={section.title} className="space-y-3 min-w-0">
                  <div className="flex items-start gap-2 min-w-0">
                    <section.icon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-heading text-sm font-semibold leading-tight">{section.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                    </div>
                  </div>
                  {section.fields.map((f) => {
                    const id = `${idPrefix}-${f.name}`;
                    return (
                      <div key={f.name} className="space-y-1.5 min-w-0">
                        <Label htmlFor={id} className="text-sm font-body font-semibold">{f.label}</Label>
                        <Input
                          id={id}
                          className="h-12 text-base w-full"
                          type={f.date ? "date" : "text"}
                          inputMode={f.phone ? "tel" : undefined}
                          autoCapitalize={f.code ? "characters" : undefined}
                          autoCorrect={f.code ? "off" : undefined}
                          value={draft.fields[f.name] ?? ""}
                          onChange={(e) => {
                            const next = f.phone ? formatPhone(e.target.value) : e.target.value;
                            setDraft((d) => (d ? { ...d, fields: { ...d.fields, [f.name]: next } } : d));
                          }}
                          placeholder={f.placeholder}
                          data-testid={`input-${id}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : hasDetails ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 min-w-0">
              {details.map((d) => <DetailRow key={d.label} label={d.label} value={d.value} />)}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground border-t pt-4">{emptyHint}</p>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end border-t pt-4 min-w-0">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="h-12 text-base w-full sm:w-auto sm:min-w-[140px]"
              data-testid={cancelTestId}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gradient-primary text-white border-none h-12 text-base font-semibold w-full sm:w-auto sm:min-w-[180px]"
              data-testid={saveTestId}
            >
              Save
            </Button>
          </div>
        ) : (
          <Button
            ref={editButtonRef}
            size="sm" variant="outline" className="gap-1.5"
            onClick={startEditing}
            aria-label={`Edit ${title}`}
            data-testid={editTestId}
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Button>
        )}
      </CardContent>

      {viewing && viewingSrc && (
        <FullScreenImage
          src={viewingSrc}
          title={`${viewerNoun} — ${viewing}`}
          testIdPrefix={tileTestIdPrefix}
          onClose={() => setViewing(null)}
        />
      )}

      <AlertDialog open={confirmRemove !== null} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent data-testid={`dialog-remove-${tileTestIdPrefix}`}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              Remove the {confirmRemove} of {photoNoun}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The photo is only removed once you press Save. You can still press Cancel to keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-12 text-base mt-0" data-testid={`button-keep-photo-${tileTestIdPrefix}`}>
              Keep photo
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-12 text-base bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmRemove) setPhoto(confirmRemove, null);
                setConfirmRemove(null);
              }}
              data-testid={`button-confirm-remove-${tileTestIdPrefix}`}
            >
              Remove photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent data-testid={`dialog-discard-${tileTestIdPrefix}`}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your edits to {photoNoun} have not been saved yet. Discarding puts everything back the way it was.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-12 text-base mt-0" data-testid={`button-keep-editing-${tileTestIdPrefix}`}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-12 text-base bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={leaveEditing}
              data-testid={`button-confirm-discard-${tileTestIdPrefix}`}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
