package http

import (
	"net/url"
	"strconv"
	"strings"
)

const maxHistoryPoints = 5000

func parseLimit(values url.Values, fallback int, max int) int {
	limit := parseInt(values.Get("limit"), fallback)
	if limit < 1 {
		return fallback
	}
	if limit > max {
		return max
	}
	return limit
}

func parseOffset(values url.Values) int {
	offset := parseInt(values.Get("offset"), 0)
	if offset < 0 {
		return 0
	}
	return offset
}

func parseInt(raw string, fallback int) int {
	parsed, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil {
		return fallback
	}
	return parsed
}

func parseFloatPtr(raw string) *float64 {
	clean := strings.TrimSpace(raw)
	if clean == "" {
		return nil
	}
	parsed, err := strconv.ParseFloat(clean, 64)
	if err != nil {
		return nil
	}
	return &parsed
}

func parseCategories(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}

	parts := strings.Split(raw, ",")
	result := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))
	for _, part := range parts {
		clean := strings.TrimSpace(part)
		if clean == "" {
			continue
		}
		if _, exists := seen[clean]; exists {
			continue
		}
		seen[clean] = struct{}{}
		result = append(result, clean)
	}
	return result
}

func parseProductHistoryPoints(values url.Values) int {
	historyPoints := parseInt(values.Get("history_points"), 0)
	if historyPoints <= 0 {
		return 0
	}
	if historyPoints > maxHistoryPoints {
		return maxHistoryPoints
	}
	return historyPoints
}
