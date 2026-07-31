import cardFrontSvg from "@/assets/insurance-card-front.svg?raw";
import cardBackSvg from "@/assets/insurance-card-back.svg?raw";

// Seeded as data URLs rather than asset URLs so the sample card is stored in the
// same shape an uploaded photo would be, and stays independent of the deploy path.
function toDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_CARD_FRONT = toDataUrl(cardFrontSvg);
export const SAMPLE_CARD_BACK = toDataUrl(cardBackSvg);
