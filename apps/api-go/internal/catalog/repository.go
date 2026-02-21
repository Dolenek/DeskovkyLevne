package catalog

import (
	"context"
	"fmt"
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

const defaultSummaryRelation = "public.catalog_slug_summary"

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

	results, err := collectRows(rows)
	if err != nil {
		return nil, 0, err
	}
	countSQL := "select count(*) from " + r.summaryRelation + whereSQL
	var total int64
	if err := r.db.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	return results, total, nil
}

func (r *Repository) Search(
	ctx context.Context,
	query string,
	availability string,
	limit int,
) ([]SuggestionRow, error) {
	safeQuery := strings.TrimSpace(query)
	if safeQuery == "" {
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

func (r *Repository) FetchCategoryCounts(
	ctx context.Context,
	filters CategoryFilters,
) ([]CategoryCount, error) {
	whereSQL, args := buildWhere(Filters{Availability: filters.Availability})
	query := `
select tag as category, count(*)::bigint as count
from (
  select unnest(category_tags) as tag
  from ` + r.summaryRelation + whereSQL + `
) expanded
group by tag
order by count desc, category asc;
`
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := make([]CategoryCount, 0, 256)
	for rows.Next() {
		var entry CategoryCount
		if err := rows.Scan(&entry.Category, &entry.Count); err != nil {
			return nil, err
		}
		results = append(results, entry)
	}
	return results, rows.Err()
}

func (r *Repository) FetchPriceRange(
	ctx context.Context,
	filters PriceRangeFilters,
) (PriceRange, error) {
	whereSQL, args := buildWhere(Filters{
		Availability: filters.Availability,
		Categories:   filters.Categories,
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

func buildRowsQuery(
	relation string,
	whereSQL string,
	args []any,
	filters Filters,
) (string, []any) {
	limitPlaceholder := fmt.Sprintf("$%d", len(args)+1)
	offsetPlaceholder := fmt.Sprintf("$%d", len(args)+2)
	query := `
select
  product_code,
  product_name,
  product_name_normalized,
  product_name_search,
  currency_code,
  availability_label,
  stock_status_label,
  latest_price::double precision,
  previous_price::double precision,
  first_price::double precision,
  list_price_with_vat::double precision,
  source_url,
  latest_scraped_at::text,
  hero_image_url,
  coalesce(gallery_image_urls, '{}'::text[]),
  short_description,
  coalesce(supplementary_parameters, '[]'::jsonb),
  coalesce(metadata, '{}'::jsonb),
  coalesce(price_points, '[]'::jsonb),
  coalesce(category_tags, '{}'::text[])
from ` + relation + whereSQL + `
order by product_name asc
limit ` + limitPlaceholder + ` offset ` + offsetPlaceholder + `;`

	rowArgs := append([]any{}, args...)
	rowArgs = append(rowArgs, filters.Limit, filters.Offset)
	return query, rowArgs
}

func buildSearchQuery(
	relation string,
	whereSQL string,
	args []any,
	limit int,
) (string, []any) {
	limitPlaceholder := fmt.Sprintf("$%d", len(args)+1)
	query := `
select
  product_code,
  product_name,
  product_name_normalized,
  product_name_search,
  currency_code,
  availability_label,
  latest_price::double precision,
  hero_image_url,
  coalesce(gallery_image_urls, '{}'::text[]),
  coalesce(category_tags, '{}'::text[])
from ` + relation + whereSQL + `
order by product_name asc
limit ` + limitPlaceholder + `;`

	queryArgs := append([]any{}, args...)
	queryArgs = append(queryArgs, limit)
	return query, queryArgs
}

func buildWhere(filters Filters) (string, []any) {
	clauses := make([]string, 0, 6)
	args := make([]any, 0, 8)
	availability := strings.ToLower(strings.TrimSpace(filters.Availability))
	if availability == "available" {
		clauses = append(clauses, "is_available = true")
	}
	if availability == "preorder" {
		clauses = append(clauses, "is_preorder = true")
	}
	if filters.MinPrice != nil {
		args = append(args, *filters.MinPrice)
		clauses = append(clauses, fmt.Sprintf("latest_price >= $%d", len(args)))
	}
	if filters.MaxPrice != nil {
		args = append(args, *filters.MaxPrice)
		clauses = append(clauses, fmt.Sprintf("latest_price <= $%d", len(args)))
	}
	if len(filters.Categories) > 0 {
		args = append(args, filters.Categories)
		clauses = append(clauses, fmt.Sprintf("category_tags && $%d::text[]", len(args)))
	}
	if strings.TrimSpace(filters.Query) != "" {
		pattern := "%" + normalizeSearchQuery(filters.Query) + "%"
		args = append(args, pattern)
		current := len(args)
		clauses = append(clauses, fmt.Sprintf("(product_name_search ilike $%d or product_code ilike $%d)", current, current))
	}
	if len(clauses) == 0 {
		return "", args
	}
	return " where " + strings.Join(clauses, " and "), args
}

func normalizeSearchQuery(value string) string {
	cleaned := strings.TrimSpace(value)
	cleaned = strings.ReplaceAll(cleaned, ",", " ")
	cleaned = strings.ReplaceAll(cleaned, "*", " ")
	return strings.ToLower(strings.Join(strings.Fields(cleaned), " "))
}

func collectRows(rows pgxRows) ([]Row, error) {
	results := make([]Row, 0, 128)
	for rows.Next() {
		var row Row
		if err := rows.Scan(
			&row.ProductCode,
			&row.ProductName,
			&row.ProductNameNormalized,
			&row.ProductNameSearch,
			&row.CurrencyCode,
			&row.AvailabilityLabel,
			&row.StockStatusLabel,
			&row.LatestPrice,
			&row.PreviousPrice,
			&row.FirstPrice,
			&row.ListPriceWithVat,
			&row.SourceURL,
			&row.LatestScrapedAt,
			&row.HeroImageURL,
			&row.GalleryImageURLs,
			&row.ShortDescription,
			&row.SupplementaryParameters,
			&row.Metadata,
			&row.PricePoints,
			&row.CategoryTags,
		); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func collectSuggestionRows(rows pgxRows) ([]SuggestionRow, error) {
	results := make([]SuggestionRow, 0, 64)
	for rows.Next() {
		var row SuggestionRow
		if err := rows.Scan(
			&row.ProductCode,
			&row.ProductName,
			&row.ProductNameNormalized,
			&row.ProductNameSearch,
			&row.CurrencyCode,
			&row.AvailabilityLabel,
			&row.LatestPrice,
			&row.HeroImageURL,
			&row.GalleryImageURLs,
			&row.CategoryTags,
		); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

type pgxRows interface {
	Next() bool
	Scan(dest ...any) error
	Err() error
}
