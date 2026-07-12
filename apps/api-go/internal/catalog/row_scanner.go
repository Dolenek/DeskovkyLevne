package catalog

func collectRows(rows pgxRows) ([]Row, int64, error) {
	results := make([]Row, 0, 128)
	var total int64
	for rows.Next() {
		var row Row
		if err := scanCatalogRow(rows, &row, &total); err != nil {
			return nil, 0, err
		}
		results = append(results, row)
	}
	return results, total, rows.Err()
}

func scanCatalogRow(rows pgxRows, row *Row, total *int64) error {
	return rows.Scan(
		&row.ProductCode,
		&row.ProductName,
		&row.ProductNameNormalized,
		&row.ProductNameSearch,
		&row.CurrencyCode,
		&row.AvailabilityLabel,
		&row.StockStatusLabel,
		&row.LatestPrice,
		&row.PreviousPrice,
		&row.FirstPrice,
		&row.ListPriceWithVat,
		&row.SourceURL,
		&row.LatestScrapedAt,
		&row.HeroImageURL,
		&row.GalleryImageURLs,
		&row.ShortDescription,
		&row.SupplementaryParameters,
		&row.Metadata,
		&row.PricePoints,
		&row.CategoryTags,
		&row.SellerCount,
		total,
	)
}

func collectSuggestionRows(rows pgxRows) ([]SuggestionRow, error) {
	results := make([]SuggestionRow, 0, 64)
	for rows.Next() {
		var row SuggestionRow
		if err := scanSuggestionRow(rows, &row); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func scanSuggestionRow(rows pgxRows, row *SuggestionRow) error {
	return rows.Scan(
		&row.ProductCode,
		&row.ProductName,
		&row.ProductNameNormalized,
		&row.ProductNameSearch,
		&row.CurrencyCode,
		&row.AvailabilityLabel,
		&row.LatestPrice,
		&row.HeroImageURL,
		&row.GalleryImageURLs,
		&row.SellerCount,
		&row.CategoryTags,
	)
}

type pgxRows interface {
	Next() bool
	Scan(dest ...any) error
	Err() error
}
