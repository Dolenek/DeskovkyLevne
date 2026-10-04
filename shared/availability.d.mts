export type AvailabilityTone = "available" | "unavailable" | "preorder" | "unknown";
export function decodeAvailabilityLabel(value: string): string;
export function normalizeAvailabilityLabel(value: string): string;
export function getAvailabilityTone(value: string | null | undefined): AvailabilityTone;
export function mapAvailabilityToSchema(value: string | null | undefined): string | undefined;
