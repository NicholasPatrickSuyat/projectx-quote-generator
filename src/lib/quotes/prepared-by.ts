/**
 * Prepared By for new/duplicated quotes while demo auth is active.
 * Returns undefined when no usable identity so Company Settings can fall back.
 */
export function preparedByFromSessionUser(
  fullName: string | null | undefined,
): string | undefined {
  const trimmed = fullName?.trim();
  return trimmed ? trimmed : undefined;
}
