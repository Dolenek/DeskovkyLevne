package catalog

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

var searchTokenSeparatorPattern = regexp.MustCompile(`[^a-z0-9]+`)

func buildRowsQuery(
	relation string,
	whereSQL string,
	args []any,
	filters Filters,
) (string, []any) {
	rowArgs := append([]any{}, args...)
	orderSQL := "product_name asc, product_name_normalized asc"
	if filters.RandomSeed != nil {
		rowArgs = append(rowArgs, *filters.RandomSeed)
		orderSQL = fmt.Sprintf(
			"md5(coalesce(product_name_normalized, product_name, product_code, '') || ':' || $%d::text) asc, product_name_normalized asc",
			len(rowArgs),
		)
	}
	limitPlaceholder := fmt.Sprintf("$%d", len(rowArgs)+1)
	offsetPlaceholder := fmt.Sprintf("$%d", len(rowArgs)+2)
	query := catalogRowsSelect + relation + whereSQL + `
order by ` + orderSQL + `
limit ` + limitPlaceholder + ` offset ` + offsetPlaceholder + `;`
	return query, append(rowArgs, filters.Limit, filters.Offset)
}

const catalogRowsSelect = `
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
  coalesce(category_tags, '{}'::text[]),
  coalesce(seller_count, 1),
  count(*) over()::bigint as total_count
from `

func buildSearchQuery(
	relation string,
	whereSQL string,
	args []any,
	limit int,
) (string, []any) {
	limitPlaceholder := fmt.Sprintf("$%d", len(args)+1)
	query := searchRowsSelect + relation + ` catalog_summary` + whereSQL + `
order by product_name asc, product_name_normalized asc
limit ` + limitPlaceholder + `;`
	return query, append(append([]any{}, args...), limit)
}

const searchRowsSelect = `
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
  greatest(1, (
    select count(distinct seller_state.seller)::integer
    from public.catalog_slug_seller_state seller_state
    where seller_state.product_name_normalized = catalog_summary.product_name_normalized
  )) as seller_count,
  coalesce(category_tags, '{}'::text[])
from `

func buildWhere(filters Filters) (string, []any) {
	clauses := make([]string, 0, 8)
	args := make([]any, 0, 8)
	appendAvailabilityClauses(&clauses, filters.Availability)
	appendPriceClauses(&clauses, &args, filters.MinPrice, filters.MaxPrice)
	appendStructuredFilterClauses(&clauses, &args, filters)
	if codeClause := buildProductCodesClause(&args, filters.ProductCodes); codeClause != "" {
		clauses = append(clauses, codeClause)
	}
	if strings.EqualFold(strings.TrimSpace(filters.PriceMovement), "decreased") {
		clauses = append(clauses, "(price_movement = 'decreased' or latest_price < list_price_with_vat)")
	}
	if searchClause := buildSearchClause(&args, filters.Query); searchClause != "" {
		clauses = append(clauses, searchClause)
	}
	if len(clauses) == 0 {
		return "", args
	}
	return " where " + strings.Join(clauses, " and "), args
}

func buildProductCodesClause(args *[]any, productCodes []string) string {
	if len(productCodes) == 0 {
		return ""
	}
	*args = append(*args, productCodes)
	return fmt.Sprintf("product_code = any($%d::text[])", len(*args))
}

func appendAvailabilityClauses(clauses *[]string, availability string) {
	switch strings.ToLower(strings.TrimSpace(availability)) {
	case "available":
		*clauses = append(*clauses, "is_available = true")
	case "preorder":
		*clauses = append(*clauses, "is_preorder = true")
	}
}

func appendPriceClauses(clauses *[]string, args *[]any, minPrice *float64, maxPrice *float64) {
	if minPrice != nil {
		*args = append(*args, *minPrice)
		*clauses = append(*clauses, fmt.Sprintf("latest_price >= $%d", len(*args)))
	}
	if maxPrice != nil {
		*args = append(*args, *maxPrice)
		*clauses = append(*clauses, fmt.Sprintf("latest_price <= $%d", len(*args)))
	}
}

func appendStructuredFilterClauses(clauses *[]string, args *[]any, filters Filters) {
	candidates := []string{
		buildCategoryClause(args, filters.Categories),
		buildPlayerClause(filters.PlayerRanges),
		buildPlaytimeClause(filters.PlaytimeRanges),
		buildAgeClause(args, filters.AgeRatings),
	}
	for _, candidate := range candidates {
		if candidate != "" {
			*clauses = append(*clauses, candidate)
		}
	}
}

func normalizeSearchQuery(value string) string {
	cleaned := strings.TrimSpace(stripDiacritics(value))
	cleaned = searchTokenSeparatorPattern.ReplaceAllString(strings.ToLower(cleaned), " ")
	return strings.Join(strings.Fields(cleaned), " ")
}

func stripDiacritics(value string) string {
	var builder strings.Builder
	for _, character := range norm.NFD.String(value) {
		if !unicode.Is(unicode.Mn, character) {
			builder.WriteRune(character)
		}
	}
	return builder.String()
}

func buildSearchClause(args *[]any, query string) string {
	tokens := strings.Fields(normalizeSearchQuery(query))
	clauses := make([]string, 0, len(tokens))
	for _, token := range tokens {
		*args = append(*args, "%"+token+"%")
		placeholder := len(*args)
		clauses = append(clauses, fmt.Sprintf(
			"(product_name_search ilike $%d or product_code ilike $%d)",
			placeholder,
			placeholder,
		))
	}
	if len(clauses) == 0 {
		return ""
	}
	return "(" + strings.Join(clauses, " and ") + ")"
}
