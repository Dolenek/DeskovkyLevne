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
