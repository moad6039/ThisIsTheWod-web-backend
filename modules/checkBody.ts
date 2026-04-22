export function checkBody(
  body: Record<string, unknown>,
  keys: string[],
): boolean {
  return keys.every(
    (field) => body[field] !== undefined && body[field] !== "",
  );
}