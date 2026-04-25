// backend/modules/checkBody.ts
// Vérifie que tous les champs requis sont présents et non vides.

export function checkBody(
  body: Record<string, unknown>,
  keys: string[],
): boolean {
  for (const field of keys) {
    const v = body[field];
    if (v === undefined || v === null || v === "") return false;
  }
  return true;
}
