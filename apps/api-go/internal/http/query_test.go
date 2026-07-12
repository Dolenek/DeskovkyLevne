package http

import (
	"net/url"
	"strings"
	"testing"
)

func TestParseProductHistoryPoints(t *testing.T) {
	values := url.Values{"history_points": []string{"250"}}
	got, err := parseProductHistoryPoints(values)
	if err != nil || got != 250 {
		t.Fatalf("expected 250, got %d, err=%v", got, err)
	}
}

func TestParseProductHistoryPointsCap(t *testing.T) {
	values := url.Values{"history_points": []string{"999999"}}
	got, err := parseProductHistoryPoints(values)
	if err != nil || got != maxHistoryPoints {
		t.Fatalf("expected cap %d, got %d, err=%v", maxHistoryPoints, got, err)
	}
}

func TestParseListNormalizesAndDeduplicates(t *testing.T) {
	got := parseList("2-4, 4-PLUS,2-4,,")
	if len(got) != 2 || got[0] != "2-4" || got[1] != "4-plus" {
		t.Fatalf("unexpected values: %#v", got)
	}
}

func TestCatalogValidationRejectsInvalidValues(t *testing.T) {
	cases := []url.Values{
		{"limit": []string{"invalid"}},
		{"offset": []string{"-1"}},
		{"availability": []string{"unknown"}},
		{"players": []string{"unknown"}},
		{"age": []string{"7"}},
		{"min_price": []string{"NaN"}},
		{"min_price": []string{"500"}, "max_price": []string{"100"}},
		{"random_seed": []string{"invalid"}},
		{"q": []string{strings.Repeat("a", maxSearchLength+1)}},
		{"product_codes": []string{strings.Repeat("x", maxProductCodeSize+1)}},
	}
	for _, values := range cases {
		if _, err := parseCatalogFilters(values, 200); err == nil {
			t.Fatalf("expected validation error for %#v", values)
		}
	}
}

func TestCatalogValidationParsesProductCodeAllowlist(t *testing.T) {
	filters, err := parseCatalogFilters(
		url.Values{"product_codes": []string{"A-1, B-2,A-1"}},
		200,
	)
	if err != nil {
		t.Fatalf("unexpected validation error: %v", err)
	}
	if len(filters.ProductCodes) != 2 || filters.ProductCodes[1] != "B-2" {
		t.Fatalf("unexpected product codes: %#v", filters.ProductCodes)
	}
}

func TestCatalogValidationParsesSupportedValues(t *testing.T) {
	values := url.Values{
		"availability":   []string{"available"},
		"categories":     []string{"strategicka,fantasy"},
		"players":        []string{"2-4"},
		"playtime":       []string{"30-60"},
		"age":            []string{"8,10"},
		"price_movement": []string{"decreased"},
		"limit":          []string{"24"},
		"offset":         []string{"48"},
		"random_seed":    []string{"987"},
	}
	filters, err := parseCatalogFilters(values, 200)
	if err != nil {
		t.Fatalf("unexpected validation error: %v", err)
	}
	if filters.Limit != 24 || filters.Offset != 48 || filters.RandomSeed == nil {
		t.Fatalf("unexpected filters: %#v", filters)
	}
}

func TestValidateSearchQueryRejectsExcessiveLength(t *testing.T) {
	query := make([]byte, maxSearchLength+1)
	for index := range query {
		query[index] = 'a'
	}
	if _, err := validateSearchQuery(string(query)); err == nil {
		t.Fatal("expected long search query to fail")
	}
}
