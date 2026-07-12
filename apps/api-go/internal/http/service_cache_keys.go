package http

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	"tlamasite/apps/api-go/internal/catalog"
)

func catalogCacheKey(filters catalog.Filters) string {
	parts := []string{
		normalizeAvailability(filters.Availability),
		fmt.Sprintf("min:%s", floatPtrKey(filters.MinPrice)),
		fmt.Sprintf("max:%s", floatPtrKey(filters.MaxPrice)),
		fmt.Sprintf("q:%s", strings.ToLower(strings.TrimSpace(filters.Query))),
		fmt.Sprintf("cats:%s", sortedJoin(filters.Categories)),
		fmt.Sprintf("players:%s", sortedJoin(filters.PlayerRanges)),
		fmt.Sprintf("playtime:%s", sortedJoin(filters.PlaytimeRanges)),
		fmt.Sprintf("ages:%s", intJoin(filters.AgeRatings)),
		fmt.Sprintf("movement:%s", strings.ToLower(strings.TrimSpace(filters.PriceMovement))),
		fmt.Sprintf("codes:%s", encodedJoin(filters.ProductCodes)),
		fmt.Sprintf("l:%d", filters.Limit),
		fmt.Sprintf("o:%d", filters.Offset),
	}
	return "catalog:" + strings.Join(parts, ";")
}

func searchCacheKey(query string, availability string, productCodes []string, limit int) string {
	return fmt.Sprintf(
		"suggest:%s:%s:codes=%s:%d",
		strings.ToLower(strings.TrimSpace(query)),
		normalizeAvailability(availability),
		encodedJoin(productCodes),
		limit,
	)
}

func priceRangeCacheKey(filters catalog.PriceRangeFilters) string {
	return fmt.Sprintf(
		"price-range:%s:cats=%s:players=%s:playtime=%s:ages=%s:movement=%s:codes=%s",
		normalizeAvailability(filters.Availability),
		sortedJoin(filters.Categories),
		sortedJoin(filters.PlayerRanges),
		sortedJoin(filters.PlaytimeRanges),
		intJoin(filters.AgeRatings),
		strings.ToLower(strings.TrimSpace(filters.PriceMovement)),
		encodedJoin(filters.ProductCodes),
	)
}

func sortedJoin(values []string) string {
	normalized := append([]string(nil), values...)
	sort.Strings(normalized)
	return strings.Join(normalized, "|")
}

func encodedJoin(values []string) string {
	normalized := append([]string(nil), values...)
	sort.Strings(normalized)
	encoded := make([]string, 0, len(normalized))
	for _, value := range normalized {
		encoded = append(encoded, fmt.Sprintf("%d:%s", len(value), value))
	}
	return strings.Join(encoded, "|")
}

func intJoin(values []int) string {
	if len(values) == 0 {
		return ""
	}
	parts := make([]string, 0, len(values))
	for _, value := range values {
		parts = append(parts, fmt.Sprintf("%d", value))
	}
	sort.Strings(parts)
	return strings.Join(parts, "|")
}

func normalizeAvailability(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func floatPtrKey(value *float64) string {
	if value == nil {
		return "nil"
	}
	return strconv.FormatFloat(*value, 'g', -1, 64)
}

func productCacheKey(slug string, historyPoints int) string {
	return fmt.Sprintf(
		"product:%s:points-per-seller=%d",
		strings.ToLower(strings.TrimSpace(slug)),
		historyPoints,
	)
}
