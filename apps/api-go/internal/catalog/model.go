package catalog

import "encoding/json"

type Row struct {
	ProductCode             *string         `json:"product_code"`
	ProductName             *string         `json:"product_name"`
	ProductNameNormalized   *string         `json:"product_name_normalized"`
	ProductNameSearch       *string         `json:"product_name_search,omitempty"`
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
	PricePoints             json.RawMessage `json:"price_points"`
	CategoryTags            []string        `json:"category_tags,omitempty"`
}

type Filters struct {
	Availability   string
	MinPrice       *float64
	MaxPrice       *float64
	Categories     []string
	PlayerRanges   []string
	PlaytimeRanges []string
	AgeRatings     []int
	PriceMovement  string
	Query          string
	Limit          int
	Offset         int
	RandomSeed     *int64
}

type CategoryCount struct {
	Category string `json:"category"`
	Count    int64  `json:"count"`
}

type CategoryFilters struct {
	Availability   string
	Categories     []string
	PlayerRanges   []string
	PlaytimeRanges []string
	AgeRatings     []int
	PriceMovement  string
}

type PriceRangeFilters struct {
	Availability   string
	Categories     []string
	PlayerRanges   []string
	PlaytimeRanges []string
	AgeRatings     []int
	PriceMovement  string
}

type PriceRange struct {
	MinPrice *float64 `json:"min_price"`
	MaxPrice *float64 `json:"max_price"`
}

type SuggestionRow struct {
	ProductCode           *string  `json:"product_code"`
	ProductName           *string  `json:"product_name"`
	ProductNameNormalized *string  `json:"product_name_normalized"`
	ProductNameSearch     *string  `json:"product_name_search,omitempty"`
	CurrencyCode          *string  `json:"currency_code"`
	AvailabilityLabel     *string  `json:"availability_label"`
	LatestPrice           *float64 `json:"latest_price"`
	HeroImageURL          *string  `json:"hero_image_url"`
	GalleryImageURLs      []string `json:"gallery_image_urls"`
	SellerCount           *int     `json:"seller_count,omitempty"`
	CategoryTags          []string `json:"category_tags"`
}

type FilterOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type FilterOptions struct {
	Categories     []FilterOption `json:"categories"`
	PlayerRanges   []FilterOption `json:"player_ranges"`
	PlaytimeRanges []FilterOption `json:"playtime_ranges"`
	AgeRatings     []FilterOption `json:"age_ratings"`
	Availability   []FilterOption `json:"availability"`
	PriceMovement  []FilterOption `json:"price_movement"`
}
