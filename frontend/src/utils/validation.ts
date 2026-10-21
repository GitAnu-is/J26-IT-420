export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  // Matches backend passwordSchema: min 8, 1 lowercase, 1 uppercase, 1 digit
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value)
  );
}

export function isValidPh(value: string): boolean {
  if (value.trim() === '') return true;
  const n = Number(value);
  return !Number.isNaN(n) && n >= 3.0 && n <= 10.0;
}