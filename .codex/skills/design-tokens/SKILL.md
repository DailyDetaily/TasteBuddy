---
name: design-tokens
description: Convert existing styles or mockup values into reusable design tokens for color, spacing, typography, and related primitives. Use when a frontend needs style normalization, token extraction, or a bridge from ad hoc values to a scalable design system.
---

# Design Tokens

Extract repeated style decisions into a token structure that is easy to maintain.

## Workflow
- Inspect existing values and group them by role instead of by raw number or color alone.
- Normalize near-duplicate values when the visual difference is not intentional.
- Keep token names semantic and predictable.
- Map tokens to the project's implementation format such as CSS variables, JSON, or theme objects.
- Preserve room for future extension without overengineering the first version.

## Output
- Provide the token structure.
- Show how the tokens should be applied in code.
