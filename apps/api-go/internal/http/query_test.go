package http

import (
	"net/url"
	"testing"
)

func TestParseProductHistoryPoints(t *testing.T) {
	values := url.Values{}
	values.Set("history_points", "250")
	if got := parseProductHistoryPoints(values); got != 250 {
		t.Fatalf("expected 250, got %d", got)
	}
}

func TestParseProductHistoryPointsCap(t *testing.T) {
	values := url.Values{}
	values.Set("history_points", "999999")
	if got := parseProductHistoryPoints(values); got != maxHistoryPoints {
		t.Fatalf("expected cap %d, got %d", maxHistoryPoints, got)
	}
}

func TestParseListDeduplicatesValues(t *testing.T) {
	got := parseList("2-4, 4-plus,2-4,,")
	if len(got) != 2 || got[0] != "2-4" || got[1] != "4-plus" {
		t.Fatalf("unexpected values: %#v", got)
	}
}

func TestParseListKeepsRequestedFilterTokens(t *testing.T) {
	got := parseList("strategicka,fantasy,30-60,available,decreased")
	want := []string{"strategicka", "fantasy", "30-60", "available", "decreased"}
	if len(got) != len(want) {
		t.Fatalf("expected %d values, got %#v", len(want), got)
	}
	for index, value := range want {
		if got[index] != value {
			t.Fatalf("expected %q at index %d, got %#v", value, index, got)
		}
	}
}

func TestParseAgesDeduplicatesValidNumbers(t *testing.T) {
	got := parseAges("6,8,6,nope")
	if len(got) != 2 || got[0] != 6 || got[1] != 8 {
		t.Fatalf("unexpected ages: %#v", got)
	}
}

func TestParseInt64Ptr(t *testing.T) {
	got := parseInt64Ptr("12345")
	if got == nil || *got != 12345 {
		t.Fatalf("expected 12345, got %#v", got)
	}
	if parseInt64Ptr("nope") != nil {
		t.Fatalf("expected invalid seed to parse as nil")
	}
}
