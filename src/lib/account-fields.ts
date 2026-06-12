export const SEX_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,30}$/.test(value);
}

export function calculateAge(dateOfBirth: Date | string | null | undefined) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const hasBirthdayPassed =
    monthDiff > 0 || (monthDiff === 0 && today.getDate() >= dob.getDate());

  if (!hasBirthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}
