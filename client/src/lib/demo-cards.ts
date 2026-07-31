import medicalFrontSvg from "@/assets/medical-card-front.svg?raw";
import medicalBackSvg from "@/assets/medical-card-back.svg?raw";
import dentalFrontSvg from "@/assets/dental-card-front.svg?raw";
import dentalBackSvg from "@/assets/dental-card-back.svg?raw";

// Seeded as data URLs rather than asset URLs so the sample cards are stored in the
// same shape an uploaded photo would be, and stay independent of the deploy path.
function toDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_MEDICAL_CARD_FRONT = toDataUrl(medicalFrontSvg);
export const SAMPLE_MEDICAL_CARD_BACK = toDataUrl(medicalBackSvg);
export const SAMPLE_DENTAL_CARD_FRONT = toDataUrl(dentalFrontSvg);
export const SAMPLE_DENTAL_CARD_BACK = toDataUrl(dentalBackSvg);
