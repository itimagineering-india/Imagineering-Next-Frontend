/** 1° tile id for API `tile` query — must match backend `encodeTile`. */
export function encodeTile(lat: number, lng: number): string {
  return `${Math.floor(lat)}_${Math.floor(lng)}`;
}
