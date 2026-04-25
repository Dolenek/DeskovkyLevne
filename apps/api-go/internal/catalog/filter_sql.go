package catalog

import (
	"fmt"
	"strings"
)

func buildCategoryClause(args *[]any, categories []string) string {
	clauses := make([]string, 0, len(categories))
	for _, category := range categories {
		switch strings.ToLower(strings.TrimSpace(category)) {
		case "strategicka":
			*args = append(*args, []string{"Strategická"})
			clauses = append(clauses, fmt.Sprintf("game_type_tags && $%d::text[]", len(*args)))
		case "rodinna":
			*args = append(*args, []string{"Rodinná"})
			clauses = append(clauses, fmt.Sprintf("game_type_tags && $%d::text[]", len(*args)))
		case "fantasy":
			*args = append(*args, []string{"Fantasy"})
			clauses = append(clauses, fmt.Sprintf("genre_tags && $%d::text[]", len(*args)))
		case "kooperativni":
			*args = append(*args, []string{"Kooperativní"})
			gameTypePosition := len(*args)
			*args = append(*args, []string{"Cooperative Game"})
			mechanicPosition := len(*args)
			clauses = append(clauses, fmt.Sprintf(
				"(game_type_tags && $%d::text[] or mechanic_tags && $%d::text[])",
				gameTypePosition,
				mechanicPosition,
			))
		case "ekonomicka":
			*args = append(*args, []string{"Ekonomické"})
			clauses = append(clauses, fmt.Sprintf("genre_tags && $%d::text[]", len(*args)))
		default:
			clean := strings.TrimSpace(category)
			if clean != "" {
				*args = append(*args, []string{clean})
				clauses = append(clauses, fmt.Sprintf("category_tags && $%d::text[]", len(*args)))
			}
		}
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
