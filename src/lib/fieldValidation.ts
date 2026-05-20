/** Strip non-digits from a phone string. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Returns an error message, or null if the phone has exactly 10 digits. */
export function validatePhone10(value: string): string | null {
  const digits = phoneDigits(value);
  if (digits.length !== 10) {
    return "Phone must be exactly 10 digits.";
  }
  return null;
}

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Optional email: empty/whitespace is ok; non-empty must be valid. */
export function validateEmailOptional(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!EMAIL_RE.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}

/** Returns an error message if trim(value) is empty. */
export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) {
    return `${label} is required.`;
  }
  return null;
}

/** Returns an error message if value is not a finite number > 0. */
export function validatePositiveNumber(value: string, label: string): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return `Enter a valid ${label.toLowerCase()}.`;
  }
  return null;
}

/** Returns the first non-null error from a list of checks. */
export function firstError(...checks: (string | null)[]): string | null {
  for (const c of checks) {
    if (c) return c;
  }
  return null;
}

/** Remark or image: at least one must be present. */
export function validateRemarkOrImage(
  remark: string,
  hasImage: boolean,
): string | null {
  if (!remark.trim() && !hasImage) {
    return "Enter a remark and/or choose an image.";
  }
  return null;
}
