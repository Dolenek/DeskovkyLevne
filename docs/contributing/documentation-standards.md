# Documentation Standards

## Canonical Policy
- `docs/` is the canonical documentation source.
- Keep docs current-state only.
- Keep canonical docs English-first.
- Avoid duplicate truth across files; link to canonical pages.

## Required Documentation Updates
A code task is incomplete until impacted docs are updated in the same task when the task changes:
- system behavior
- API contract
- configuration
- data model rules
- operational workflows

## Stale Content Rule
- If a code change invalidates existing docs, remove or rewrite stale sections in the same task.
- Do not leave historical notes or cleanup logs in canonical docs.
- If legacy paths are decommissioned (for example direct DB read APIs), remove them from canonical runtime docs in the same task.

## Author Checklist
1. Identify impacted docs pages before coding.
2. Update canonical pages under `docs/`.
3. Remove outdated statements and conflicting references.
4. Keep examples aligned with current code paths and env names.
5. Verify links from root/service README still point to canonical pages.

## Code Cleanup Review

- Verify unused-code findings against application entry points, test runners,
  dynamic imports, package scripts, and operational consumers before removal.
- Keep analysis exceptions narrow and explain their purpose in configuration.
  Do not suppress findings merely to make CI pass.
- Reproduce behavior fixes with focused regression tests. Review slug identity,
  seller separation, presentation priority, and missing-versus-zero prices when
  changing product transformations.
- Run the applicable checks documented in
  [Build and Deploy](../operations/build-and-deploy.md#continuous-integration).

## Page Ownership Model
- Architecture: `../architecture/overview.md`
- Domain invariants: `../domain/product-model.md`
- API contract: `../api/http-api.md`
- Frontend runtime behavior: `../frontend/runtime.md`
- Build/deploy operations: `../operations/build-and-deploy.md`
- Configuration: `../operations/configuration.md`
- Data refresh operations: `../operations/data-refresh.md`
