export function normalizeFieldValue(formData: FormData, fieldKey: string): string {
  return String(formData.get(fieldKey) ?? "").trim();
}
