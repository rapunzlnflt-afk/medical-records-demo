import React, { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Edit2, X, ZoomIn, ZoomOut } from "lucide-react";
import { fileToStorableDataUrl, IMAGE_READ_ERROR, IMAGE_UPLOAD_ACCEPT } from "@/lib/image";

// Viewer sits above the demo's promo banners (z-index 9999) via the shared
// DialogContent, which carries the z-modal token.
const VIEWER_DIALOG_CLASS =
  "p-0 gap-0 max-w-none w-screen h-[100dvh] max-h-[100dvh] rounded-none border-0 left-0 right-0 top-0 translate-x-0 translate-y-0 " +
  "sm:left-0 sm:right-0 sm:top-0 sm:w-screen sm:max-w-none sm:translate-x-0 sm:translate-y-0 sm:rounded-none sm:p-0 " +
  "overflow-hidden flex flex-col bg-black text-white";

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

function CardPhotoTile({ label, value, onChange, onView, testId }: {
  label: string;
  value: string | null | undefined;
  onChange: (dataUrl: string | null) => void;
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
        <div className="relative">
          <button
            type="button"
            onClick={onView}
            className="block w-full aspect-[1.586] rounded-lg border overflow-hidden bg-muted/30"
            data-testid={`button-view-${testId}`}
          >
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </button>
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <Button
              type="button" size="icon" variant="secondary"
              className="w-8 h-8 rounded-full shadow"
              onClick={() => inputRef.current?.click()}
              aria-label={`Replace ${label}`}
              data-testid={`button-replace-${testId}`}
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button
              type="button" size="icon" variant="destructive"
              className="w-8 h-8 rounded-full shadow"
              onClick={() => onChange(null)}
              aria-label={`Remove ${label}`}
              data-testid={`button-remove-${testId}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full aspect-[1.586] min-h-[104px] rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1.5 px-2 text-center hover:bg-muted/30 transition-colors"
          data-testid={`button-add-${testId}`}
        >
          <Camera className="w-6 h-6 text-muted-foreground/60" />
          <span className="text-xs font-body text-muted-foreground leading-tight">
            {busy ? "Processing…" : "Take or choose a photo"}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        onChange={handleFile}
        className="hidden"
        data-testid={`input-${testId}`}
      />
      {error && <p className="text-xs text-destructive break-words">{error}</p>}
    </div>
  );
}

/**
 * One insurance card: front/back photo tiles, a full-screen viewer, and a
 * read-only detail list. Rendered once for medical and once for dental — the
 * two differ only in copy, testid prefix, and which detail rows they list.
 */
export function InsuranceCardSection({
  icon: Icon, title, description, viewerNoun, tileTestIdPrefix, editTestId,
  front, back, onFrontChange, onBackChange, details, emptyHint, onEdit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  /** Prefixes the viewer dialog title, e.g. "Medical card" -> "Medical card — front". */
  viewerNoun: string;
  tileTestIdPrefix: string;
  editTestId: string;
  front: string | null | undefined;
  back: string | null | undefined;
  onFrontChange: (dataUrl: string | null) => void;
  onBackChange: (dataUrl: string | null) => void;
  details: { label: string; value: React.ReactNode }[];
  emptyHint: string;
  onEdit: () => void;
}) {
  const [viewing, setViewing] = useState<"front" | "back" | null>(null);
  const viewingSrc = viewing === "front" ? front : back;
  const hasDetails = details.some((d) => d.value !== null && d.value !== undefined && d.value !== "");

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

        <div className="grid grid-cols-2 gap-3 min-w-0">
          <CardPhotoTile
            label="Front"
            value={front}
            onChange={onFrontChange}
            onView={() => setViewing("front")}
            testId={`${tileTestIdPrefix}-front`}
          />
          <CardPhotoTile
            label="Back"
            value={back}
            onChange={onBackChange}
            onView={() => setViewing("back")}
            testId={`${tileTestIdPrefix}-back`}
          />
        </div>

        {hasDetails ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 min-w-0">
            {details.map((d) => <DetailRow key={d.label} label={d.label} value={d.value} />)}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground border-t pt-4">{emptyHint}</p>
        )}

        <Button
          size="sm" variant="outline" className="gap-1.5"
          onClick={onEdit}
          data-testid={editTestId}
        >
          <Edit2 className="w-3.5 h-3.5" /> {hasDetails ? "Edit plan details" : "Add plan details"}
        </Button>
      </CardContent>

      {viewing && viewingSrc && (
        <FullScreenImage
          src={viewingSrc}
          title={`${viewerNoun} — ${viewing}`}
          testIdPrefix={tileTestIdPrefix}
          onClose={() => setViewing(null)}
        />
      )}
    </Card>
  );
}
