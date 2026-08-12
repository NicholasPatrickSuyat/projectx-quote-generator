import bcrypt from "bcryptjs";

/**
 * Production password hashing (M18).
 * Target cost factor 12 — report if deployed login latency is unacceptable before changing.
 */

export const BCRYPT_COST = 12;
export const PASSWORD_MIN_LENGTH = 12;

export const GENERIC_INVALID_LOGIN =
  "Invalid email or password.";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}

export function passwordMeetsPolicy(plain: string): boolean {
  return plain.length >= PASSWORD_MIN_LENGTH;
}
