package catalog

import (
	"fmt"
	"strings"
)

type tagFieldMatch struct {
	field string
	tags  []string
}

type categoryTagRule struct {
	matches []tagFieldMatch
}

var categoryTagRules = map[string]categoryTagRule{
	"strategicka": {
		matches: []tagFieldMatch{{field: "game_type_tags", tags: []string{"Strategick\u00e1"}}},
	},
	"rodinna": {
		matches: []tagFieldMatch{{field: "game_type_tags", tags: []string{"Rodinn\u00e1"}}},
	},
	"fantasy": {
		matches: []tagFieldMatch{
			{field: "genre_tags", tags: []string{"Fantasy"}},
			{field: "category_tags", tags: []string{"Fantasy"}},
			{field: "game_type_tags", tags: []string{"Fantasy"}},
		},
	},
	"kooperativni": {
		matches: []tagFieldMatch{
			{field: "game_type_tags", tags: []string{"Kooperativn\u00ed"}},
			{field: "mechanic_tags", tags: []string{"Cooperative Game"}},
		},
	},
	"ekonomicka": {
		matches: []tagFieldMatch{{field: "genre_tags", tags: []string{"Ekonomick\u00e9"}}},
	},
}

func buildCategoryClause(args *[]any, categories []string) string {
	clauses := make([]string, 0, len(categories))
	for _, category := range categories {
		clean := strings.TrimSpace(category)
		if clean == "" {
			continue
		}
		if rule, ok := categoryTagRules[strings.ToLower(clean)]; ok {
			clauses = append(clauses, buildTagFieldsClause(args, rule.matches))
			continue
		}
		matches := []tagFieldMatch{{field: "category_tags", tags: []string{clean}}}
		clauses = append(clauses, buildTagFieldsClause(args, matches))
	}
	return joinOrClauses(clauses)
}

func buildTagFieldsClause(args *[]any, matches []tagFieldMatch) string {
	clauses := make([]string, 0, len(matches))
	for _, match := range matches {
		*args = append(*args, match.tags)
		clauses = append(
			clauses,
			fmt.Sprintf("coalesce(%s, '{}'::text[]) && $%d::text[]", match.field, len(*args)),
		)
	}
	return joinOrClauses(clauses)
}

func buildPlayerClause(ranges []string) string {
	clauses := make([]string, 0, len(ranges))
	for _, value := range ranges {
		switch strings.ToLower(strings.TrimSpace(value)) {
		case "1-2":
			clauses = append(clauses, "(min_players <= 2 and coalesce(max_players, min_players) >= 1)")
		case "2-4":
			clauses = append(clauses, "(min_players <= 4 and coalesce(max_players, min_players) >= 2)")
		case "4-plus":
			clauses = append(clauses, "(coalesce(max_players, min_players) >= 4)")
		}
	}
	return joinOrClauses(clauses)
}

func buildPlaytimeClause(ranges []string) string {
	clauses := make([]string, 0, len(ranges))
	for _, value := range ranges {
		switch strings.ToLower(strings.TrimSpace(value)) {
		case "under-30":
			clauses = append(clauses, "(coalesce(max_playtime_minutes, min_playtime_minutes) <= 30)")
		case "30-60":
			clauses = append(clauses, "(min_playtime_minutes <= 60 and coalesce(max_playtime_minutes, min_playtime_minutes) >= 30)")
		case "60-plus":
			clauses = append(clauses, "(coalesce(max_playtime_minutes, min_playtime_minutes) >= 60)")
		}
	}
	return joinOrClauses(clauses)
}

func buildAgeClause(args *[]any, ages []int) string {
	clauses := make([]string, 0, len(ages))
	for _, age := range ages {
		if age < 1 {
			continue
		}
		*args = append(*args, age)
		clauses = append(clauses, fmt.Sprintf("min_age <= $%d", len(*args)))
	}
	return joinOrClauses(clauses)
}

func joinOrClauses(clauses []string) string {
	if len(clauses) == 0 {
		return ""
	}
	if len(clauses) == 1 {
		return clauses[0]
	}
	return "(" + strings.Join(clauses, " or ") + ")"
}
