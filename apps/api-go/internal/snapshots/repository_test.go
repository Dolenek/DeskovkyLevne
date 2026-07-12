package snapshots

import (
	"strings"
	"testing"
)

func assertQueryContains(t *testing.T, query string, expected string) {
	t.Helper()
	if !strings.Contains(query, expected) {
		t.Fatalf("query does not contain %q", expected)
	}
}

func TestSellerMetadataQueryUsesCanonicalSlugAndSellerPriority(t *testing.T) {
	assertQueryContains(t, sellerMetadataQuery, "public.canonical_product_slug")
	assertQueryContains(t, sellerMetadataQuery, "public.catalog_slug_seller_state")
	assertQueryContains(t, sellerMetadataQuery, "seller_state.product_name_normalized")
	assertQueryContains(t, sellerMetadataQuery, "'tlamagames', 'tlamagase'")
}

func TestPriceHistoryQueryLimitsEachSellerIndependently(t *testing.T) {
	assertQueryContains(t, priceHistoryQuery, "public.catalog_daily_price_history")
	assertQueryContains(t, priceHistoryQuery, "partition by history.seller")
	assertQueryContains(t, priceHistoryQuery, "seller_row_number <= $2")
	assertQueryContains(t, priceHistoryQuery, "order by seller asc, price_date asc")
}

func TestRecentDiscountsQueryKeepsSellerGranularity(t *testing.T) {
	assertQueryContains(t, recentDiscountsQuery, "product_name_normalized")
	assertQueryContains(t, recentDiscountsQuery, "seller")
	assertQueryContains(t, recentDiscountsQuery, "latest_price < previous_price")
	assertQueryContains(t, recentDiscountsQuery, "latest_price < list_price_with_vat")
}

func TestIndexSellersInitializesHistory(t *testing.T) {
	sellers := []Seller{{Seller: "alpha"}, {Seller: "beta"}}
	indexes := indexSellers(sellers)
	if indexes["alpha"] != 0 || indexes["beta"] != 1 {
		t.Fatalf("unexpected indexes: %#v", indexes)
	}
	for _, seller := range sellers {
		if seller.History == nil {
			t.Fatalf("history was not initialized for %q", seller.Seller)
		}
	}
}
