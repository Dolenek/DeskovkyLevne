package snapshots

import (
	"strings"
	"testing"
)

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
}
