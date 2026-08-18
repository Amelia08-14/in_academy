type ApiErrorBody = {
  error?: unknown;
  errors?: unknown;
  message?: unknown;
};

function messageFrom(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  return messageFrom(record.message) ?? messageFrom(record.error);
}

export function apiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;

  const { error, errors, message } = body as ApiErrorBody;
  const direct = messageFrom(error) ?? messageFrom(message);
  if (direct) return direct;

  if (errors && typeof errors === "object") {
    const first = Object.values(errors as Record<string, unknown>)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .find((value) => typeof value === "string" && value.trim());
    if (typeof first === "string") return first;
  }

  return fallback;
}
