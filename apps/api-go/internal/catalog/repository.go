package catalog

import (
	"context"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db              *pgxpool.Pool
	summaryRelation string
}

type RepositoryOptions struct {
	SummaryRelation string
}

const defaultSummaryRelation = "public.catalog_slug_state"

var relationNamePattern = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$`)

func NewRepository(db *pgxpool.Pool, options ...RepositoryOptions) *Repository {
	config := RepositoryOptions{SummaryRelation: defaultSummaryRelation}
	if len(options) > 0 {
		config = options[0]
	}
	return &Repository{
		db:              db,
		summaryRelation: normalizeRelationName(config.SummaryRelation),
	}
}

func (r *Repository) Fetch(ctx context.Context, filters Filters) ([]Row, int64, error) {
	whereSQL, args := buildWhere(filters)
	rowsSQL, rowArgs := buildRowsQuery(r.summaryRelation, whereSQL, args, filters)
	rows, err := r.db.Query(ctx, rowsSQL, rowArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	results, total, err := collectRows(rows)
	if err != nil {
		return nil, 0, err
	}
	if len(results) == 0 && filters.Offset > 0 {
		countSQL := "select count(*) from " + r.summaryRelation + whereSQL
		if err := r.db.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
			return nil, 0, err
		}
	}
	return results, total, nil
}

func (r *Repository) Search(
	ctx context.Context,
	query string,
	availability string,
	limit int,
) ([]SuggestionRow, error) {
	safeQuery := normalizeSearchQuery(query)
	if len(safeQuery) < 2 {
		return []SuggestionRow{}, nil
	}
	filters := Filters{
		Availability: availability,
		Query:        safeQuery,
		Limit:        limit,
		Offset:       0,
	}
	whereSQL, args := buildWhere(filters)
	querySQL, queryArgs := buildSearchQuery(
		r.summaryRelation,
		whereSQL,
		args,
		filters.Limit,
	)
	rows, err := r.db.Query(ctx, querySQL, queryArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectSuggestionRows(rows)
}

func (r *Repository) FetchPriceRange(
	ctx context.Context,
	filters PriceRangeFilters,
) (PriceRange, error) {
	whereSQL, args := buildWhere(Filters{
		Availability:   filters.Availability,
		Categories:     filters.Categories,
		PlayerRanges:   filters.PlayerRanges,
		PlaytimeRanges: filters.PlaytimeRanges,
		AgeRatings:     filters.AgeRatings,
		PriceMovement:  filters.PriceMovement,
	})
	query := `
select
  min(latest_price)::double precision,
  max(latest_price)::double precision
from ` + r.summaryRelation + whereSQL + `;`

	var bounds PriceRange
	if err := r.db.QueryRow(ctx, query, args...).Scan(
		&bounds.MinPrice,
		&bounds.MaxPrice,
	); err != nil {
		return PriceRange{}, err
	}
	return bounds, nil
}

func normalizeRelationName(value string) string {
	normalized := strings.TrimSpace(value)
	if normalized == "" {
		return defaultSummaryRelation
	}
	if !relationNamePattern.MatchString(normalized) {
		return defaultSummaryRelation
	}
	return normalized
}
