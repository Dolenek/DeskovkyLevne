package http

import (
	"fmt"
	"math"
	"net/url"
	"strconv"
	"strings"
	"unicode/utf8"

	"tlamasite/apps/api-go/internal/catalog"
)

const (
	maxHistoryPoints   = 5000
	maxDiscountResults = 100
	maxSearchLength    = 120
	maxCatalogOffset   = 1_000_000
	maxProductCodes    = 200
	maxProductCodeSize = 120
)

var supportedCategories = stringSet("strategicka", "rodinna", "fantasy", "kooperativni", "ekonomicka")
var supportedAvailabilities = stringSet("available", "preorder")
var supportedPlayerRanges = stringSet("1-2", "2-4", "4-plus")
var supportedPlaytimeRanges = stringSet("under-30", "30-60", "60-plus")
var supportedAgeRatings = stringSet("6", "8", "10", "12")
var supportedPriceMovements = stringSet("decreased")

type commonFilters struct {
	availability   string
	categories     []string
	playerRanges   []string
	playtimeRanges []string
	ageRatings     []int
	priceMovement  string
}

func parseCatalogFilters(
	values url.Values,
	maxPageSize int,
) (catalog.Filters, error) {
	common, err := parseCommonFilters(values)
	if err != nil {
		return catalog.Filters{}, err
	}
	limit, err := parseBoundedInt(values, "limit", 20, maxPageSize)
	if err != nil {
		return catalog.Filters{}, err
	}
	offset, err := parseOffset(values)
	if err != nil {
		return catalog.Filters{}, err
	}
	minPrice, err := parsePrice(values, "min_price")
	if err != nil {
		return catalog.Filters{}, err
	}
	maxPrice, err := parsePrice(values, "max_price")
	if err != nil {
		return catalog.Filters{}, err
	}
	if minPrice != nil && maxPrice != nil && *minPrice > *maxPrice {
		return catalog.Filters{}, fmt.Errorf("min_price must not exceed max_price")
	}
	randomSeed, err := parseOptionalInt64(values, "random_seed")
	if err != nil {
		return catalog.Filters{}, err
	}
	query, err := validateSearchQuery(values.Get("q"))
	if err != nil {
		return catalog.Filters{}, err
	}
	productCodes, err := parseProductCodes(values.Get("product_codes"))
	if err != nil {
		return catalog.Filters{}, err
	}
	return buildCatalogFilters(
		common, minPrice, maxPrice, limit, offset, randomSeed, query, productCodes,
	), nil
}

func buildCatalogFilters(
	common commonFilters,
	minPrice *float64,
	maxPrice *float64,
	limit int,
	offset int,
	randomSeed *int64,
	query string,
	productCodes []string,
) catalog.Filters {
	return catalog.Filters{
		Availability: common.availability, MinPrice: minPrice, MaxPrice: maxPrice,
		Categories: common.categories, PlayerRanges: common.playerRanges,
		PlaytimeRanges: common.playtimeRanges, AgeRatings: common.ageRatings,
		PriceMovement: common.priceMovement, Query: query, ProductCodes: productCodes,
		Limit: limit, Offset: offset, RandomSeed: randomSeed,
	}
}

func parsePriceRangeFilters(values url.Values) (catalog.PriceRangeFilters, error) {
	common, err := parseCommonFilters(values)
	if err != nil {
		return catalog.PriceRangeFilters{}, err
	}
	productCodes, err := parseProductCodes(values.Get("product_codes"))
	if err != nil {
		return catalog.PriceRangeFilters{}, err
	}
	return catalog.PriceRangeFilters{
		Availability: common.availability, Categories: common.categories,
		PlayerRanges: common.playerRanges, PlaytimeRanges: common.playtimeRanges,
		AgeRatings: common.ageRatings, PriceMovement: common.priceMovement,
		ProductCodes: productCodes,
	}, nil
}

func parseProductCodes(raw string) ([]string, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}
	seen := make(map[string]struct{})
	result := make([]string, 0)
	for _, candidate := range strings.Split(raw, ",") {
		code := strings.TrimSpace(candidate)
		if code == "" {
			continue
		}
		if utf8.RuneCountInString(code) > maxProductCodeSize {
			return nil, fmt.Errorf("product code must not exceed %d characters", maxProductCodeSize)
		}
		if _, exists := seen[code]; !exists {
			seen[code] = struct{}{}
			result = append(result, code)
		}
		if len(result) > maxProductCodes {
			return nil, fmt.Errorf("product_codes must not contain more than %d values", maxProductCodes)
		}
	}
	return result, nil
}

func parseCommonFilters(values url.Values) (commonFilters, error) {
	availability, err := parseOptionalEnum(values.Get("availability"), "availability", supportedAvailabilities)
	if err != nil {
		return commonFilters{}, err
	}
	categories, err := parseEnumList(values.Get("categories"), "categories", supportedCategories)
	if err != nil {
		return commonFilters{}, err
	}
	players, err := parseEnumList(values.Get("players"), "players", supportedPlayerRanges)
	if err != nil {
		return commonFilters{}, err
	}
	playtime, err := parseEnumList(values.Get("playtime"), "playtime", supportedPlaytimeRanges)
	if err != nil {
		return commonFilters{}, err
	}
	ages, err := parseAgeRatings(values.Get("age"))
	if err != nil {
		return commonFilters{}, err
	}
	movement, err := parseOptionalEnum(values.Get("price_movement"), "price_movement", supportedPriceMovements)
	return commonFilters{availability, categories, players, playtime, ages, movement}, err
}

func parseBoundedInt(values url.Values, key string, fallback int, maximum int) (int, error) {
	raw := strings.TrimSpace(values.Get(key))
	if raw == "" {
		return fallback, nil
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil || parsed < 1 {
		return 0, fmt.Errorf("%s must be a positive integer", key)
	}
	if parsed > maximum {
		return maximum, nil
	}
	return parsed, nil
}

func parseOffset(values url.Values) (int, error) {
	raw := strings.TrimSpace(values.Get("offset"))
	if raw == "" {
		return 0, nil
	}
	offset, err := strconv.Atoi(raw)
	if err != nil || offset < 0 || offset > maxCatalogOffset {
		return 0, fmt.Errorf("offset must be between 0 and %d", maxCatalogOffset)
	}
	return offset, nil
}

func parsePrice(values url.Values, key string) (*float64, error) {
	raw := strings.TrimSpace(values.Get(key))
	if raw == "" {
		return nil, nil
	}
	price, err := strconv.ParseFloat(raw, 64)
	if err != nil || math.IsNaN(price) || math.IsInf(price, 0) || price < 0 {
		return nil, fmt.Errorf("%s must be a finite non-negative number", key)
	}
	return &price, nil
}

func parseOptionalInt64(values url.Values, key string) (*int64, error) {
	raw := strings.TrimSpace(values.Get(key))
	if raw == "" {
		return nil, nil
	}
	parsed, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("%s must be an integer", key)
	}
	return &parsed, nil
}

func parseOptionalEnum(raw string, key string, allowed map[string]struct{}) (string, error) {
	normalized := strings.ToLower(strings.TrimSpace(raw))
	if normalized == "" {
		return "", nil
	}
	if _, exists := allowed[normalized]; !exists {
		return "", fmt.Errorf("unsupported %s value %q", key, raw)
	}
	return normalized, nil
}

func parseEnumList(raw string, key string, allowed map[string]struct{}) ([]string, error) {
	values := parseList(raw)
	for _, value := range values {
		if _, exists := allowed[value]; !exists {
			return nil, fmt.Errorf("unsupported %s value %q", key, value)
		}
	}
	return values, nil
}

func parseList(raw string) []string {
	seen := make(map[string]struct{})
	result := make([]string, 0)
	for _, part := range strings.Split(strings.ToLower(raw), ",") {
		value := strings.TrimSpace(part)
		if value == "" {
			continue
		}
		if _, exists := seen[value]; !exists {
			seen[value] = struct{}{}
			result = append(result, value)
		}
	}
	return result
}

func parseAgeRatings(raw string) ([]int, error) {
	values, err := parseEnumList(raw, "age", supportedAgeRatings)
	if err != nil {
		return nil, err
	}
	ages := make([]int, 0, len(values))
	for _, value := range values {
		age, _ := strconv.Atoi(value)
		ages = append(ages, age)
	}
	return ages, nil
}

func parseProductHistoryPoints(values url.Values) (int, error) {
	raw := strings.TrimSpace(values.Get("history_points"))
	if raw == "" || raw == "0" {
		return 0, nil
	}
	return parseBoundedInt(values, "history_points", 0, maxHistoryPoints)
}

func validateSearchQuery(raw string) (string, error) {
	query := strings.TrimSpace(raw)
	if utf8.RuneCountInString(query) > maxSearchLength {
		return "", fmt.Errorf("q must not exceed %d characters", maxSearchLength)
	}
	return query, nil
}

func validateProductSlug(raw string) (string, error) {
	slug := strings.ToLower(strings.TrimSpace(raw))
	if slug == "" {
		return "", fmt.Errorf("slug is required")
	}
	if utf8.RuneCountInString(slug) > 200 {
		return "", fmt.Errorf("slug must not exceed 200 characters")
	}
	return slug, nil
}

func stringSet(values ...string) map[string]struct{} {
	result := make(map[string]struct{}, len(values))
	for _, value := range values {
		result[value] = struct{}{}
	}
	return result
}
