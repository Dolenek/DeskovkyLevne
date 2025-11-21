const SELLER_DISPLAY_NAMES: Record<string, string> = {
  tlamagames: "Tlama Games",
  tlamagase: "TlamaGase",
  planetaher: "Planeta Her",
};

export const getSellerDisplayName = (sellerId: string | null | undefined): string => {
  if (!sellerId) {
    return "Neznámý prodejce";
  }
  const normalized = sellerId.trim().toLowerCase();
  return SELLER_DISPLAY_NAMES[normalized] ?? sellerId;
};
