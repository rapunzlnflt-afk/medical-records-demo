// MedRecords Care entitlement, demo edition.
//
// In the full app Care is a paid tier (a Care license key or a grandfathered
// phone). The demo shows Care unlocked so visitors can try the Care Log.


export function hasCare(): boolean {
  return true;
}

export function useCare(): boolean {
  return true;
}

// The demo shares cleartrackapps.com with the paid app, so it keeps its own
// key and never reads or writes the app's "mrCareLoggedBy".
const NAME_KEY = "mrDemo:careLoggedBy";
/** The first name this device logs care entries under. Defaults to the demo's owner. */
export function getLoggerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || "Jamie";
  } catch {
    return "Jamie";
  }
}
export function setLoggerName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name.trim());
  } catch {
    /* ignore */
  }
}
