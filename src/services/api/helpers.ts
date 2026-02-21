import { FILTER_CODES } from "./config";

export const filterRowsByCode = <T extends { product_code?: string | null }>(
  rows: T[]
): T[] => {
  if (FILTER_CODES.length === 0) {
    return rows;
  }

  const allowedCodes = new Set(FILTER_CODES);
  return rows.filter((row) => {
    if (!row.product_code) {
      return false;
    }
    return allowedCodes.has(row.product_code);
  });
};

export const sanitizeSearchTerm = (term: string) =>
  term.replace(/[,*]/g, " ").trim();

export const normalizeSearchTerm = (term: string) =>
  term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
