// Ported from web auth/useField.ts validators.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_RE = /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/;

export interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
  special: boolean;
}

export function passwordChecks(value: string): PasswordChecks {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    digit: /[0-9]/.test(value),
    special: SPECIAL_RE.test(value)
  };
}

export function isStrongPassword(value: string): boolean {
  const c = passwordChecks(value);
  return c.length && c.upper && c.lower && c.digit && c.special;
}
