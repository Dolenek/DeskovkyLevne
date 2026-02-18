# Documentation Hub

This folder is the canonical source of truth for repository documentation.

## Documentation Map
- `architecture/overview.md`: system architecture and data flow.
- `domain/product-model.md`: domain rules and invariants.
- `api/http-api.md`: backend HTTP API contract.
- `frontend/runtime.md`: frontend runtime behavior and routing.
- `operations/build-and-deploy.md`: build pipeline and deployment runbook.
- `operations/configuration.md`: environment variables and defaults.
- `operations/data-refresh.md`: read-model refresh operations.
- `contributing/documentation-standards.md`: documentation contribution rules.

## Principles
- Current-state only: docs describe behavior as it is now.
- English-first: canonical docs are maintained in English.
- Single source of truth: avoid duplicate specs across files.
- Docs gate: behavior/config/API/model changes must include same-task docs updates.

## Reader Entry Points
- New engineer onboarding:
  1. `architecture/overview.md`
  2. `domain/product-model.md`
  3. `frontend/runtime.md`
  4. `api/http-api.md`
- Operations and deployment:
  1. `operations/configuration.md`
  2. `operations/build-and-deploy.md`
  3. `operations/data-refresh.md`
