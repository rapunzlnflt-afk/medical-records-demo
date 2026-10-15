// Demo-only preview of "Share doses with a caregiver" (MedRecords Max).
// Mirrors the app's row in More tools, the way Pawfolio's demo previews
// sitter sharing: it explains the feature, with the link button turned off.
// The demo has no server, so nothing is shared.

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CaregiverSharePreview() {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="card-caregiver-share">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full text-left px-4 py-3 flex items-center gap-3 min-h-[56px] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            data-testid="button-toggle-caregiver-share"
          >
            <Users className="w-5 h-5 flex-shrink-0 text-primary" />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold leading-tight">Share doses with a caregiver</span>
              <span className="block text-xs text-muted-foreground mt-0.5 break-words">
                They tap Given or Skip on their phone, and you see who gave each dose.
              </span>
            </span>
            <span className="flex items-center gap-1.5 flex-shrink-0 text-muted-foreground">
              <Badge variant="secondary" className="text-[10px] font-medium">Max</Badge>
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              In MedRecords Max, you send a caregiver a link. They see only the medications you
              choose, get a reminder when each dose is due, and tap Given or Skip. You see who gave
              each dose. Nothing else in your records is shared.
            </p>
            <Button type="button" className="w-full" disabled data-testid="button-create-caregiver-link">
              Create caregiver link
            </Button>
            <p className="text-xs text-muted-foreground">Not available in the demo.</p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
