package http

import (
	"fmt"
	"sort"
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
	return fmt.Sprintf(
		"price-range:%s:cats=%s:players=%s:playtime=%s:ages=%s:movement=%s",
		normalizeAvailability(filters.Availability),
		sortedJoin(filters.Categories),
		sortedJoin(filters.PlayerRanges),
		sortedJoin(filters.PlaytimeRanges),
		intJoin(filters.AgeRatings),
		strings.ToLower(strings.TrimSpace(filters.PriceMovement)),
	)
}

func sortedJoin(values []string) string {
	normalized := append([]string(nil), values...)
	sort.Strings(normalized)
	return strings.Join(normalized, "|")
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
	return fmt.Sprintf("%.4f", *value)
}
