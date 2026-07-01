package catalog

import (
	"strings"
	"testing"
)

func TestNormalizeRelationName(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "default when empty",
			input: "",
			want:  defaultSummaryRelation,
		},
		{
			name:  "accept schema relation",
			input: "public.catalog_slug_state",
			want:  "public.catalog_slug_state",
		},
		{
			name:  "reject dangerous token",
			input: "public.catalog_slug_state; drop table x;",
			want:  defaultSummaryRelation,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizeRelationName(tc.input)
			if got != tc.want {
				t.Fatalf("expected %q, got %q", tc.want, got)
			}
		})
	}
}

func TestBuildWhereIncludesNewCatalogFilters(t *testing.T) {
	minPrice := 200.0
	maxPrice := 1500.0
	whereSQL, args := buildWhere(Filters{
		Availability:   "available",
		MinPrice:       &minPrice,
		MaxPrice:       &maxPrice,
		Categories:     []string{"strategicka", "kooperativni"},
		PlayerRanges:   []string{"2-4"},
		PlaytimeRanges: []string{"30-60"},
		AgeRatings:     []int{8},
		PriceMovement:  "decreased",
	})

	expectedFragments := []string{
		"is_available = true",
		"latest_price >= $1",
		"latest_price <= $2",
		"coalesce(game_type_tags, '{}'::text[]) && $3::text[]",
		"coalesce(mechanic_tags, '{}'::text[]) && $5::text[]",
		"min_players <= 4",
		"min_playtime_minutes <= 60",
		"min_age <= $6",
		"price_movement = 'decreased' or latest_price < list_price_with_vat",
	}
	for _, fragment := range expectedFragments {
		if !strings.Contains(whereSQL, fragment) {
			t.Fatalf("expected %q in %s", fragment, whereSQL)
		}
	}
	if len(args) != 6 {
		t.Fatalf("expected 6 args, got %#v", args)
	}
}

func TestBuildWhereMapsCategorySlugsAcrossTagFields(t *testing.T) {
	whereSQL, args := buildWhere(Filters{
		Categories: []string{"fantasy", "ekonomicka", "custom"},
	})

	expectedFragments := []string{
		"coalesce(genre_tags, '{}'::text[]) && $1::text[]",
		"coalesce(category_tags, '{}'::text[]) && $2::text[]",
		"coalesce(game_type_tags, '{}'::text[]) && $3::text[]",
		"coalesce(genre_tags, '{}'::text[]) && $4::text[]",
		"coalesce(category_tags, '{}'::text[]) && $5::text[]",
	}
	for _, fragment := range expectedFragments {
		if !strings.Contains(whereSQL, fragment) {
			t.Fatalf("expected %q in %s", fragment, whereSQL)
		}
	}
	if len(args) != 5 {
		t.Fatalf("expected 5 args, got %#v", args)
	}
}

func TestBuildWhereIncludesRangeFilterSemantics(t *testing.T) {
	whereSQL, _ := buildWhere(Filters{
		PlayerRanges:   []string{"1-2", "2-4", "4-plus"},
		PlaytimeRanges: []string{"under-30", "30-60", "60-plus"},
		AgeRatings:     []int{6, 10},
	})

	expectedFragments := []string{
		"min_players <= 2 and coalesce(max_players, min_players) >= 1",
		"min_players <= 4 and coalesce(max_players, min_players) >= 2",
		"coalesce(max_players, min_players) >= 4",
		"coalesce(max_playtime_minutes, min_playtime_minutes) <= 30",
		"min_playtime_minutes <= 60 and coalesce(max_playtime_minutes, min_playtime_minutes) >= 30",
		"coalesce(max_playtime_minutes, min_playtime_minutes) >= 60",
		"min_age <= $1",
		"min_age <= $2",
	}
	for _, fragment := range expectedFragments {
		if !strings.Contains(whereSQL, fragment) {
			t.Fatalf("expected %q in %s", fragment, whereSQL)
		}
	}
}

func TestNormalizeSearchQueryRemovesDiacriticsAndSpecialCharacters(t *testing.T) {
	got := normalizeSearchQuery(" Výbušná koťátka: párty/karty*** ")
	want := "vybusna kotatka party karty"
	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestBuildWhereUsesAllSearchTokensAgainstNameAndCode(t *testing.T) {
	whereSQL, args := buildWhere(Filters{Query: "vybusna party"})

	expectedFragments := []string{
		"(product_name_search ilike $1 or product_code ilike $1)",
		"(product_name_search ilike $2 or product_code ilike $2)",
		" and ",
	}
	for _, fragment := range expectedFragments {
		if !strings.Contains(whereSQL, fragment) {
			t.Fatalf("expected %q in %s", fragment, whereSQL)
		}
	}
	if len(args) != 2 || args[0] != "%vybusna%" || args[1] != "%party%" {
		t.Fatalf("unexpected args: %#v", args)
	}
}

func TestBuildRowsQueryUsesSeededRandomOrder(t *testing.T) {
	seed := int64(123)
	query, args := buildRowsQuery(
		"public.catalog_slug_state",
		" where is_available = true",
		nil,
		Filters{Limit: 12, Offset: 0, RandomSeed: &seed},
	)

	expectedFragments := []string{
		"order by md5(",
		"product_name_normalized",
		"$1::text",
		"limit $2 offset $3",
	}
	for _, fragment := range expectedFragments {
		if !strings.Contains(query, fragment) {
			t.Fatalf("expected %q in %s", fragment, query)
		}
	}
	if len(args) != 3 || args[0] != seed || args[1] != 12 || args[2] != 0 {
		t.Fatalf("unexpected args: %#v", args)
	}
}

func TestBuildSearchQueryIncludesSellerCount(t *testing.T) {
	query, args := buildSearchQuery(
		"public.catalog_slug_state",
		" where product_name_search ilike $1",
		[]any{"%implozivni%"},
		12,
	)

	expectedFragments := []string{
		"from public.catalog_slug_seller_state seller_state",
		"seller_state.product_name_normalized = catalog_summary.product_name_normalized",
		"limit $2",
	}
	for _, fragment := range expectedFragments {
		if !strings.Contains(query, fragment) {
			t.Fatalf("expected %q in %s", fragment, query)
		}
	}
	if len(args) != 2 || args[0] != "%implozivni%" || args[1] != 12 {
		t.Fatalf("unexpected args: %#v", args)
	}
}
