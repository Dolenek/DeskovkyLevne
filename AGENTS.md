## file_length_and_structure

Never allow a file to exceed 500 lines.
If a file approaches 400 lines, break it up immediately.
Treat 1000 lines as unacceptable, even temporarily.
Use folders and naming conventions to keep small files logically grouped. 

## function and class size

Keep functions under 30–40 lines.
If a class is over 200 lines, assess splitting into smaller helper classes.

## naming and readability

All class, method, and variable names must be descriptive and intention-revealing.
Avoid vague names like data, info, helper, or temp. 

## documentation discipline

Whenever an agent adds a feature or significant refactor, they must document the change in `documentation.md` (or the relevant docs file) before finishing the task.

## scalability mindset 

Always code as if someone else will scale this.
Include extension points (e.g., protocol conformance, dependency injection) from day one.

## data model and routing

- `product_name_normalized` je kanonický identifikátor. Jakékoliv nové routy nebo odkazy musí používat slug, nikdy `product_code`.
- Při agregaci snapshotů vždy udržujte informace per-prodejce. Tlamagames/tlamagase má nejvyšší prioritu pro hero obrázek, popisy a další texty, ale pokud chybí, přepněte na dalšího prodejce.
- Historie cen (grafy, statistiky) musí zobrazovat všechny dostupné prodejce daného slugu paralelně – žádné slučování do jedné čáry.
