package http

import (
	"fmt"
	"sort"
	"strings"

	"tlamasite/apps/api-go/internal/catalog"
)

func catalogCacheKey(filters catalog.Filters) string {
	categories := append([]string(nil), filters.Categories...)
	sort.Strings(categories)
	parts := []string{
		normalizeAvailability(filters.Availability),
		fmt.Sprintf("min:%s", floatPtrKey(filters.MinPrice)),
		fmt.Sprintf("max:%s", floatPtrKey(filters.MaxPrice)),
		fmt.Sprintf("q:%s", strings.ToLower(strings.TrimSpace(filters.Query))),
		fmt.Sprintf("cats:%s", strings.Join(categories, "|")),
		fmt.Sprintf("l:%d", filters.Limit),
		fmt.Sprintf("o:%d", filters.Offset),
	}
	return "catalog:" + strings.Join(parts, ";")
}

func searchCacheKey(query string, availability string, limit int) string {
	return fmt.Sprintf(
		"suggest:%s:%s:%d",
		strings.ToLower(strings.TrimSpace(query)),
		normalizeAvailability(availability),
		limit,
	)
}

func priceRangeCacheKey(filters catalog.PriceRangeFilters) string {
	categories := append([]string(nil), filters.Categories...)
	sort.Strings(categories)
	return fmt.Sprintf(
		"price-range:%s:cats=%s",
		normalizeAvailability(filters.Availability),
		strings.Join(categories, "|"),
	)
}

func normalizeAvailability(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func floatPtrKey(value *float64) string {
	if value == nil {
		return "nil"
	}
	return fmt.Sprintf("%.4f", *value)
}
