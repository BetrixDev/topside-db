export function isEmpty(obj: Record<string, unknown>): boolean {
  for (const _ in obj) {
    return false;
  }

  return true;
}

export function onlyPrimitiveValues(
  obj: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) =>
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    )
  );
}
