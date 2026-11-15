// Demo-only preview of "Share with caregivers" on the Care Log (MedRecords Care).
// Mirrors the app's card with the link button turned off, the same way the
// dose-sharing preview works. The demo has no server, so nothing is shared.

import { Users } from "lucide-react";
import type { Patient } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PersonChip } from "@/components/person-chip";

export function CareSharePreview({ patient }: { patient: Patient }) {
  const who = patient.name.trim().split(/\s+/)[0] || "this person";
  return (
    <Card data-testid="card-care-share">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <PersonChip patient={patient} testId="chip-share-person" />
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 flex-shrink-0 text-primary" />
          <p className="min-w-0 flex-1 font-heading text-base font-semibold leading-tight">Share with caregivers</p>
        </div>
        <p className="-mt-1 text-sm text-muted-foreground break-words">
          Caregivers log care for {who} from their phone. Everyone on the link sees each other's entries, and they
          appear here with their name. Caregivers join free.
        </p>
        <Button type="button" className="w-full" disabled data-testid="button-care-share-link">
          Make a link and send it
        </Button>
        <p className="text-xs text-muted-foreground">Not available in the demo.</p>
      </CardContent>
    </Card>
  );
}
