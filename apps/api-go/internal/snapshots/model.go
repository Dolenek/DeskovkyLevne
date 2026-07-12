package snapshots

import (
	"encoding/json"
	"errors"
)

var ErrProductNotFound = errors.New("product not found")

type ProductDetail struct {
	ProductNameNormalized string   `json:"product_name_normalized"`
	Sellers               []Seller `json:"sellers"`
}

type Seller struct {
	Seller                  string          `json:"seller"`
	ProductCode             *string         `json:"product_code"`
	ProductName             *string         `json:"product_name"`
	CurrencyCode            *string         `json:"currency_code"`
	AvailabilityLabel       *string         `json:"availability_label"`
	StockStatusLabel        *string         `json:"stock_status_label"`
	LatestPrice             *float64        `json:"latest_price"`
	PreviousPrice           *float64        `json:"previous_price"`
	FirstPrice              *float64        `json:"first_price"`
	ListPriceWithVat        *float64        `json:"list_price_with_vat"`
	SourceURL               *string         `json:"source_url"`
	LatestScrapedAt         *string         `json:"latest_scraped_at"`
	HeroImageURL            *string         `json:"hero_image_url"`
	GalleryImageURLs        []string        `json:"gallery_image_urls"`
	ShortDescription        *string         `json:"short_description"`
	SupplementaryParameters json.RawMessage `json:"supplementary_parameters"`
	Metadata                json.RawMessage `json:"metadata"`
	History                 []PricePoint    `json:"history"`
}

type PricePoint struct {
	PriceDate        string   `json:"price_date"`
	PriceWithVat     *float64 `json:"price_with_vat"`
	ListPriceWithVat *float64 `json:"list_price_with_vat"`
	CurrencyCode     *string  `json:"currency_code"`
	ScrapedAt        string   `json:"scraped_at"`
	SnapshotCount    int32    `json:"snapshot_count"`
}

type RecentDiscount struct {
	ProductNameNormalized string   `json:"product_name_normalized"`
	Seller                string   `json:"seller"`
	ProductCode           *string  `json:"product_code"`
	ProductName           *string  `json:"product_name"`
	CurrencyCode          *string  `json:"currency_code"`
	CurrentPrice          *float64 `json:"current_price"`
	ReferencePrice        *float64 `json:"reference_price"`
	SourceURL             *string  `json:"source_url"`
	ChangedAt             *string  `json:"changed_at"`
}
