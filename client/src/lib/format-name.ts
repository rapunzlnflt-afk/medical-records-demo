/**
 * Capitalization helper for person-name fields.
 *
 * Applied at save time so the user's typing is never disrupted mid-stream and
 * so someone who intentionally types "deWitt" can still override afterwards.
 *
 * Conservative on purpose: empty strings round-trip empty, all-caps acronyms
 * stay caps, words that already have an internal capital are left alone, and
 * separators (hyphen, apostrophe, period) all get their following letter
 * capitalized so names like "o'connor-smith" or "st. john" come out correctly.
 */

const SUFFIX_TOKENS = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);

function capitalizeWord(word: string, preserveAcronyms: boolean): string {
  if (!word) return word;
  // Mixed case — assume the user meant it (e.g. "McDonald", "deWitt").
  if (/[A-Z]/.test(word) && /[a-z]/.test(word)) return word;
  // When the rest of the input has lowercase letters somewhere, short all-caps
  // tokens look like deliberate acronyms ("USA", "NW", "II") rather than shouting.
  if (preserveAcronyms && word.length <= 4 && /^[A-Z]+$/.test(word)) return word;

  const lower = word.toLowerCase();

  if (SUFFIX_TOKENS.has(lower)) {
    return lower === "jr" || lower === "sr" ? lower[0].toUpperCase() + lower.slice(1) : lower.toUpperCase();
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Title-case a person's name. Handles multi-word names, hyphenated last names,
 * apostrophes, and generational suffixes.
 *
 *   "mary jane o'connor-smith" -> "Mary Jane O'Connor-Smith"
 *   "JOHN DOE JR"              -> "John Doe Jr"
 *   "dr. jane smith"           -> "Dr. Jane Smith"
 */
export function formatPersonName(value: string): string {
  if (!value) return value;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const preserveAcronyms = /[a-z]/.test(trimmed);
  return trimmed
    .split(" ")
    // Capitalize after letters only, preserving separators verbatim.
    .map((word) => word.replace(/[A-Za-z]+/g, (m) => capitalizeWord(m, preserveAcronyms)))
    .join(" ");
}
