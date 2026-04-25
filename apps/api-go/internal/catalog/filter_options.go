package catalog

func StaticFilterOptions() FilterOptions {
	return FilterOptions{
		Categories: []FilterOption{
			{Value: "strategicka", Label: "Strategick\u00e1"},
			{Value: "rodinna", Label: "Rodinn\u00e1"},
			{Value: "fantasy", Label: "Fantasy"},
			{Value: "kooperativni", Label: "Kooperativn\u00ed"},
			{Value: "ekonomicka", Label: "Ekonomick\u00e1"},
		},
		PlayerRanges: []FilterOption{
			{Value: "1-2", Label: "1-2"},
			{Value: "2-4", Label: "2-4"},
			{Value: "4-plus", Label: "4+"},
		},
		PlaytimeRanges: []FilterOption{
			{Value: "under-30", Label: "do 30 min"},
			{Value: "30-60", Label: "30-60 min"},
			{Value: "60-plus", Label: "60+ min"},
		},
		AgeRatings: []FilterOption{
			{Value: "6", Label: "6+"},
			{Value: "8", Label: "8+"},
			{Value: "10", Label: "10+"},
			{Value: "12", Label: "12+"},
		},
		Availability: []FilterOption{
			{Value: "available", Label: "Skladem"},
			{Value: "preorder", Label: "P\u0159edobjedn\u00e1vka"},
		},
		PriceMovement: []FilterOption{
			{Value: "decreased", Label: "Ve slev\u011b"},
		},
	}
}
