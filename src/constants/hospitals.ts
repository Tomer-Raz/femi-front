/**
 * Predefined list of hospitals with their codes
 * Used for quick hospital creation in the admin panel
 */
export const PREDEFINED_HOSPITALS = [
  { name: "אסותא", code: "AST" },
  { name: "איכילוב", code: "ICH" },
  { name: "שיבא", code: "SHB" },
  { name: "רמב״ם", code: "RMB" },
  { name: "הדסה עין כרם", code: "HEK" },
  { name: "הדסה הר הצופים", code: "HHT" },
  { name: "בילינסון", code: "BLN" },
  { name: "מאיר", code: "MAR" },
  { name: "וולפסון", code: "WLF" },
  { name: "כרמל", code: "KRM" },
  { name: "סורוקה", code: "SRK" },
  { name: "שערי צדק", code: "SHZ" },
  { name: "תל השומר", code: "THS" },
  { name: "רבין", code: "RBN" },
  { name: "ברזילי", code: "BRZ" },
  { name: "זיו", code: "ZIV" },
  { name: "נהריה", code: "NHR" },
  { name: "פוריה", code: "POR" },
  { name: "אסף הרופא", code: "ASF" },
  { name: "לניאדו", code: "LND" },
] as const;

export type PredefinedHospital = (typeof PREDEFINED_HOSPITALS)[number];