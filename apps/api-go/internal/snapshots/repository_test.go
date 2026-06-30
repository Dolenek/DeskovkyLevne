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

func TestBuildBySlugQueryWithoutHistoryLimit(t *testing.T) {
	query, args := buildBySlugQuery("alpha-game", 0)
	if len(args) != 1 {
		t.Fatalf("expected 1 arg, got %d", len(args))
	}
	if args[0] != "alpha-game" {
		t.Fatalf("unexpected slug arg: %#v", args[0])
	}
	if strings.Contains(query, "limit $2") {
		t.Fatalf("unexpected limit clause in unbounded query")
	}
	assertQueryContains(t, query, "public.catalog_daily_price_history")
	assertQueryContains(t, query, "public.catalog_slug_seller_state")
	assertQueryContains(t, query, "with requested_product as")
	assertQueryContains(t, query, "h.canonical_product_id")
	assertQueryContains(t, query, "public.canonical_product_slug")
	assertQueryContains(t, query, "h.price_date::text")
	assertQueryContains(t, query, "h.snapshot_count")
	assertQueryContains(t, query, "h.closing_price::double precision")
	assertQueryContains(t, query, "requested.canonical_product_id = h.canonical_product_id")
}

func TestBuildBySlugQueryWithHistoryLimit(t *testing.T) {
	query, args := buildBySlugQuery("alpha-game", 120)
	if len(args) != 2 {
		t.Fatalf("expected 2 args, got %d", len(args))
	}
	if args[1] != 120 {
		t.Fatalf("unexpected history limit arg: %#v", args[1])
	}
	if !strings.Contains(query, "limit $2") {
		t.Fatalf("expected limit clause in bounded query")
	}
	assertQueryContains(t, query, "recent_history as")
	assertQueryContains(t, query, "from public.catalog_daily_price_history")
	assertQueryContains(t, query, "with requested_product as")
	assertQueryContains(t, query, "order by h.price_date desc, h.seller desc")
	assertQueryContains(t, query, "join public.catalog_slug_seller_state")
}
