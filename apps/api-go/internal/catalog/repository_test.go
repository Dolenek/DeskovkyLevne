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
		"game_type_tags && $3::text[]",
		"mechanic_tags && $5::text[]",
		"min_players <= 4",
		"min_playtime_minutes <= 60",
		"min_age <= $6",
		"price_movement = 'decreased'",
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
