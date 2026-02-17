package snapshots

import "encoding/json"

type Row struct {
	ID                     int64           `json:"id"`
	ProductCode            *string         `json:"product_code"`
	ProductNameOriginal    *string         `json:"product_name_original"`
	ProductNameNormalized  *string         `json:"product_name_normalized"`
	PriceWithVat           *float64        `json:"price_with_vat"`
	ListPriceWithVat       *float64        `json:"list_price_with_vat"`
	CurrencyCode           *string         `json:"currency_code"`
	SourceURL              *string         `json:"source_url"`
	ScrapedAt              string          `json:"scraped_at"`
	AvailabilityLabel      *string         `json:"availability_label"`
	StockStatusLabel       *string         `json:"stock_status_label"`
	HeroImageURL           *string         `json:"hero_image_url"`
	GalleryImageURLs       []string        `json:"gallery_image_urls"`
	ShortDescription       *string         `json:"short_description"`
	SupplementaryParameters json.RawMessage `json:"supplementary_parameters"`
	Metadata               json.RawMessage `json:"metadata"`
	Seller                 *string         `json:"seller"`
}
