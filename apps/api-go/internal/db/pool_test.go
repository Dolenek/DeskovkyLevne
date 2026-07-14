package db

import "testing"

func TestSetRoleStatementQuotesRoleName(t *testing.T) {
	statement := setRoleStatement(`unsafe"; reset role; --`)
	expected := `set role "unsafe""; reset role; --"`
	if statement != expected {
		t.Fatalf("expected %q, got %q", expected, statement)
	}
}
