const SELLER_DISPLAY_NAMES: Record<string, string> = {
  albi: "Albi",
  imago: "imago",
  knihydobrovsky: "Knihy Dobrovský",
  ludopolis: "Ludopolis",
  najada: "Najáda",
  "svet-her": "Svět her",
  svether: "Svět her",
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
