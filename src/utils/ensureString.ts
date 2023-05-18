export function ensureString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(`Expected value value to be a string`);
  }

  return value;
}
