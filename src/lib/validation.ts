/*
 * The rules every form and server function checks the same way (owner, 21 Sep 2026): names, city,
 * state, PIN code, email and phone. India only for now, so the country defaults to India, the
 * state is one of its states and union territories, and a phone is +91 with 10 digits.
 * Each *Problem function returns the message to show, or null when the value is fine.
 */
import { PIN_CODE } from "@/lib/place";

export const DEFAULT_COUNTRY = "India";

/** India's 28 states and 8 union territories. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

/** A first or last name: letters (any script), with spaces, dots, hyphens or apostrophes between. */
export const NAME_PATTERN = /^\p{L}[\p{L}\p{M} .'-]{0,39}$/u;
/** A city: letters (any script), 2 to 60 characters, with spaces, dots or hyphens. */
export const CITY_PATTERN = /^\p{L}[\p{L}\p{M} .'-]{1,59}$/u;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function nameProblem(value: string, label: "First name" | "Last name", required = false) {
  const v = value.trim();
  if (!v) return required ? `Enter your ${label.toLowerCase()}.` : null;
  return NAME_PATTERN.test(v) ? null : `${label} can only have letters, spaces, . ' or -`;
}

export function cityProblem(value: string) {
  const v = value.trim();
  if (!v) return null;
  return CITY_PATTERN.test(v) ? null : "Enter a city name, letters only";
}

export function stateProblem(value: string) {
  const v = value.trim();
  if (!v) return null;
  return (INDIAN_STATES as readonly string[]).includes(v) ? null : "Pick a state from the list";
}

export function pinProblem(value: string) {
  const v = value.trim();
  if (!v) return null;
  return PIN_CODE.test(v) ? null : "A PIN code is 6 digits and doesn't start with 0";
}

export function emailProblem(value: string) {
  const v = value.trim();
  if (!v) return "Enter your email address.";
  return EMAIL_PATTERN.test(v) ? null : "Enter an email like name@example.com.";
}

/**
 * An Indian mobile number as +91XXXXXXXXXX, or null. Accepts 10 digits, or with +91, 91 or 0 in
 * front; the number itself starts with 6, 7, 8 or 9.
 */
export function indianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

export function phoneProblem(value: string) {
  if (!value.trim()) return "Enter your mobile number.";
  return indianPhone(value) ? null : "Enter a 10-digit mobile number (+91 is added for you)";
}
