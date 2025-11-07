export type LocaleKey = "cs" | "en";

type TranslationMap = Record<string, string>;

export const translations: Record<LocaleKey, TranslationMap> = {
  cs: {
    heroTitle: "Vývoj cen produktů",
    heroSubtitle:
      "Vyhledejte konkrétní titul nebo se podívejte, co právě zlevnilo.",
    localeLabel: "Jazyk",
    loading: "Načítám produkty…",
    errorTitle: "Něco se pokazilo",
    retry: "Zkusit znovu",
    emptyState: "Zatím tu nejsou žádné produkty.",
    latestPrice: "Aktuální cena",
    priceChange: "Změna oproti prvnímu záznamu",
    listPriceLabel: "Běžná cena",
    noSeriesData: "K tomuto produktu zatím nejsou historická data.",
    lastUpdated: "Poslední záznam: {{value}}",
    productCodeLabel: "Kód produktu",
    trackedProducts: "Sledované produkty: {{count}}",
    price: "Cena",
    date: "Datum",
    searchLabel: "Vyhledávání",
    searchPlaceholder: "Zadejte název hry nebo kód…",
    searchStartTyping: "Začněte psát alespoň 2 znaky.",
    searchNoResults: "Nic jsme nenašli pro „{{term}}“.",
    searchResultsTitle: "Výsledky vyhledávání",
    availabilityFilterOn: "Zobrazit pouze skladem",
    availabilityFilterOff: "Zobrazit vše",
    filtersTitle: "Filtry",
    filtersAvailability: "Dostupnost",
    selectedProductTitle: "Detail produktu",
    selectedProductEmpty: "Vyberte produkt ze seznamu a zobrazíme historii ceny.",
    recentDiscountsTitle: "Nedávno zlevněné",
    recentDiscountsSubtitle: "Produkty, kterým naposledy klesla cena.",
    recentDiscountsEmpty: "Nemáme zatím žádné nedávné zlevnění.",
    discountOccurred: "Zlevněno {{value}}",
    fromPrice: "Z",
    toPrice: "Na",
    viewProduct: "Zobrazit na webu",
  },
  en: {
    heroTitle: "Product price trends",
    heroSubtitle:
      "Search for any title or browse what was discounted most recently.",
    localeLabel: "Language",
    loading: "Loading products…",
    errorTitle: "Something went wrong",
    retry: "Try again",
    emptyState: "There are no products to show yet.",
    latestPrice: "Latest price",
    priceChange: "Change since the first record",
    listPriceLabel: "List price",
    noSeriesData: "This product has no historical data yet.",
    lastUpdated: "Last record: {{value}}",
    productCodeLabel: "Product code",
    trackedProducts: "Tracked products: {{count}}",
    price: "Price",
    date: "Date",
    searchLabel: "Search",
    searchPlaceholder: "Type a product name or code…",
    searchStartTyping: "Start typing at least 2 characters.",
    searchNoResults: "No matches for “{{term}}”.",
    searchResultsTitle: "Search results",
    availabilityFilterOn: "Show only available",
    availabilityFilterOff: "Show all products",
    filtersTitle: "Filters",
    filtersAvailability: "Availability",
    selectedProductTitle: "Product detail",
    selectedProductEmpty: "Pick a product from the list to see its price history.",
    recentDiscountsTitle: "Recently discounted",
    recentDiscountsSubtitle: "Products whose price dropped most recently.",
    recentDiscountsEmpty: "No recent discounts recorded.",
    discountOccurred: "Discounted {{value}}",
    fromPrice: "From",
    toPrice: "To",
    viewProduct: "View product",
  },
};

export type TranslationKey = keyof (typeof translations)["cs"];

export type TranslationValues = Record<string, string | number>;

export const interpolate = (
  template: string,
  values?: TranslationValues
): string => {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, String(value)),
    template
  );
};
