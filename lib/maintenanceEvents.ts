/** Browser event so API 503 maintenance responses can open the gate immediately. */
export const MAINTENANCE_EVENT = "imagineering:maintenance";

export function emitMaintenanceMode(message?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MAINTENANCE_EVENT, {
      detail: { message: message || undefined },
    })
  );
}

export function isMaintenancePayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return d.maintenance === true || d.code === "MAINTENANCE";
}
