export const paginationNumbers = (page: number, count: number): number[] => {
  const start = Math.max(1, Math.min(page - 2, count - 4));
  return Array.from({ length: Math.min(count, 5) }, (_, index) => start + index);
};
