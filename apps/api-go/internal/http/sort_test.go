package http

import (
	"net/url"
	"testing"
)

func TestCatalogSortValidationAndCacheIsolation(t *testing.T) {
	keys := make(map[string]bool)
	for _, sort := range []string{"name", "price_asc", "price_desc"} {
		filters, err := parseCatalogFilters(url.Values{"sort": {sort}}, 100)
		if err != nil || filters.Sort != sort {
			t.Fatalf("sort %q: %+v %v", sort, filters, err)
		}
		key := catalogCacheKey(filters)
		if keys[key] {
			t.Fatalf("sort shares cache key: %s", key)
		}
		keys[key] = true
	}
	if _, err := parseCatalogFilters(url.Values{"sort": {"invalid"}}, 100); err == nil {
		t.Fatal("invalid sort accepted")
	}
}
