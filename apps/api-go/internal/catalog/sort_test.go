package catalog

import (
	"strings"
	"testing"
)

func TestCatalogPriceSortIsStableAndNullsLast(t *testing.T) {
	for _, direction := range []string{"asc", "desc"} {
		query, args := buildRowsQuery("public.catalog_slug_state", "", nil, Filters{Sort: "price_" + direction, Limit: 10, Offset: 20})
		expected := "order by latest_price " + direction + " nulls last, product_name asc, product_name_normalized asc"
		if !strings.Contains(query, expected) {
			t.Fatalf("unexpected query: %s", query)
		}
		if len(args) != 2 || args[0] != 10 || args[1] != 20 {
			t.Fatalf("unexpected paging: %v", args)
		}
	}
}

func TestCatalogUnknownSortCannotBecomeSQL(t *testing.T) {
	order := catalogOrderSQL("latest_price; drop table catalog_slug_state")
	if order != "product_name asc, product_name_normalized asc" {
		t.Fatalf("unexpected order: %s", order)
	}
}
