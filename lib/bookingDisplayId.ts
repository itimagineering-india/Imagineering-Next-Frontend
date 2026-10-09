/** Canonical booking reference: bookingNumber (YYYYMMDD####) or legacy 10-digit. */

export function formatLegacyBookingDisplayId(bookingId: string | undefined): string {
  const id = String(bookingId || "").trim();
  if (!id) return "—";
  const cleanHex = id.replace(/[^a-fA-F0-9]/g, "").slice(-12);
  if (cleanHex) {
    const numeric = (BigInt(`0x${cleanHex}`) % BigInt(10000000000)).toString();
    return numeric.padStart(10, "0");
  }
  const digits = id.replace(/\D/g, "");
  return digits ? digits.slice(-10).padStart(10, "0") : "0000000000";
}

export function resolveBookingDisplayId(input: {
  id?: string;
  _id?: string;
  bookingNumber?: string | null;
  displayId?: string | null;
}): string {
  const displayId = String(input.displayId || "").trim();
  if (displayId) return displayId;
  const bookingNumber = String(input.bookingNumber || "").trim();
  if (bookingNumber) return bookingNumber;
  return formatLegacyBookingDisplayId(input.id || input._id);
}
