package catalog

import "testing"

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
