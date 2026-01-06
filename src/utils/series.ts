type Slugged = { slug: string };

export const uniqueSeriesBySlug = <T extends Slugged>(
  seriesList: T[]
): T[] => {
  const seen = new Set<string>();
  const unique: T[] = [];
  seriesList.forEach((series) => {
    if (seen.has(series.slug)) {
      return;
    }
    seen.add(series.slug);
    unique.push(series);
  });
  return unique;
};
