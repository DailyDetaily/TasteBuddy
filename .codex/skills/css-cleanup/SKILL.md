---
name: css-cleanup
description: Clean, consolidate, and organize CSS without changing the visual result. Use when styles are duplicated, selectors are messy, declarations are inconsistent, or a stylesheet needs refactoring while preserving the current UI.
---

# CSS Cleanup

Refactor styles for readability and maintainability without introducing visual regressions.

## Workflow
- Remove duplicate or overridden declarations that do not affect the final render.
- Group related rules and keep naming patterns consistent with the existing codebase.
- Extract repeated values into shared variables only when that reduces noise.
- Avoid speculative rewrites that change specificity or cascade behavior unnecessarily.
- Preserve the current UI and call out any risky cleanup areas.

## Output
- Provide the refactored CSS.
- Mention any areas where exact no-change behavior depends on existing cascade assumptions.
