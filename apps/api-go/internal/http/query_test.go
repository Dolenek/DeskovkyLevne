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

func TestParseAgesDeduplicatesValidNumbers(t *testing.T) {
	got := parseAges("6,8,6,nope")
	if len(got) != 2 || got[0] != 6 || got[1] != 8 {
		t.Fatalf("unexpected ages: %#v", got)
	}
}
