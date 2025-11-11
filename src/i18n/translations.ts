export type LocaleKey = "cs" | "en";

type TranslationMap = Record<string, string>;

export const translations: Record<LocaleKey, TranslationMap> = {
  cs: {
    heroTitle: "Vyvoj cen produktu",
    heroSubtitle:
      "Vyhledejte konkretni titul nebo se podivejte, co prave zlevnilo.",
    localeLabel: "Jazyk",
    loading: "Nacitam produkty...",
    errorTitle: "Neco se pokazilo",
    retry: "Zkusit znovu",
    emptyState: "Zatim tu nejsou zadne produkty.",
    latestPrice: "Aktualni cena",
    priceChange: "Zmena oproti prvnimu zaznamu",
    listPriceLabel: "Bezna cena",
    noSeriesData: "K tomuto produktu zatim nejsou historicka data.",
    lastUpdated: "Posledni zaznam: {{value}}",
    productCodeLabel: "Kod produktu",
    trackedProducts: "Sledovane produkty: {{count}}",
    price: "Cena",
    date: "Datum",
    searchLabel: "Vyhledavani",
    searchPlaceholder: "Zadejte nazev hry nebo kod...",
    searchStartTyping: "Zacnete psat alespon 2 znaky.",
    searchNoResults: "Nic jsme nenasli pro \"{{term}}\".",
    searchResultsTitle: "Vysledky vyhledavani",
    availabilityFilterOn: "Zobrazit pouze skladem",
    availabilityFilterOff: "Zobrazit vse",
    filtersTitle: "Filtry",
    filtersAvailability: "Dostupnost",
    priceFilterTitle: "Cenovy filtr",
    priceFilterMin: "Cena od",
    priceFilterMax: "Cena do",
    priceFilterHint: "Upravte rozsah a seznam nize se aktualizuje.",
    priceFilterAny: "libovolna",
    filteredResultsTitle: "Produkty podle ceny",
    filteredResultsSubtitle: "Rozsah: {{min}} - {{max}}",
    filteredResultsEmpty: "Zadny produkt nesplnuje zadane cenove rozpati.",
    filteredPaginationLabel: "Zobrazuji {{from}}-{{to}} z {{total}} produktu",
    filteredPaginationPrev: "Predchozi",
    filteredPaginationNext: "Dalsi",
    discountOccurred: "Zlevneno {{value}}",
    fromPrice: "Z",
    toPrice: "Na",
    viewProduct: "Zobrazit na webu",
    viewPriceDetail: "Otevrit detail ceny",
    detailBackToSearch: "Zpet na vyhledavani",
    detailSourceLink: "Otevrit v obchode",
    detailPriceStatsTitle: "Prehled cen",
    detailStatsLowest: "Nejnizsi zaznam",
    detailStatsHighest: "Nejvyssi zaznam",
    detailStatsAverage: "Prumer",
    detailHistoryTitle: "Historie ceny",
    detailHistorySubtitle: "Pocet zaznamu: {{count}}",
    detailTimelineEmpty: "Pro tento produkt zatim nemame historii cen.",
    detailNotFoundDescription: "Pro kod {{code}} jsme nenasli zadna data.",
  },
  en: {
    heroTitle: "Product price trends",
    heroSubtitle:
      "Search for any title or browse what was discounted most recently.",
    localeLabel: "Language",
    loading: "Loading products...",
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
    searchPlaceholder: "Type a product name or code...",
    searchStartTyping: "Start typing at least 2 characters.",
    searchNoResults: "No matches for \"{{term}}\".",
    searchResultsTitle: "Search results",
    availabilityFilterOn: "Show only available",
    availabilityFilterOff: "Show all products",
    filtersTitle: "Filters",
    filtersAvailability: "Availability",
    priceFilterTitle: "Cost filter",
    priceFilterMin: "Price from",
    priceFilterMax: "Price to",
    priceFilterHint: "Adjust the range and the list below updates instantly.",
    priceFilterAny: "any",
    filteredResultsTitle: "Products by price",
    filteredResultsSubtitle: "Range: {{min}} - {{max}}",
    filteredResultsEmpty: "No products match the selected price range.",
    filteredPaginationLabel: "Showing {{from}}-{{to}} of {{total}} products",
    filteredPaginationPrev: "Previous",
    filteredPaginationNext: "Next",
    discountOccurred: "Discounted {{value}}",
    fromPrice: "From",
    toPrice: "To",
    viewProduct: "View product",
    viewPriceDetail: "Open price detail",
    detailBackToSearch: "Back to search",
    detailSourceLink: "Open in store",
    detailPriceStatsTitle: "Price summary",
    detailStatsLowest: "Lowest recorded",
    detailStatsHighest: "Highest recorded",
    detailStatsAverage: "Average price",
    detailHistoryTitle: "Price history",
    detailHistorySubtitle: "{{count}} recorded snapshots",
    detailTimelineEmpty: "No price history yet.",
    detailNotFoundDescription: "No data available for code {{code}}.",
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
