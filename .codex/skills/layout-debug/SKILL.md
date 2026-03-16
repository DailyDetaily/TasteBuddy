---
name: layout-debug
description: Debug frontend layout and CSS issues by finding the root cause and producing a focused fix. Use when elements overflow, misalign, collapse, overlap, or behave unexpectedly across breakpoints or browsers.
---

# Layout Debug

Find the smallest reliable fix for the layout problem before rewriting structure.

## Workflow
- Reproduce the visible symptom and identify the smallest affected area.
- Inspect layout primitives first: display mode, sizing, positioning, overflow, and alignment.
- Trace whether the issue comes from parent constraints, child behavior, or breakpoint rules.
- Prefer minimal patches that resolve the root cause over broad visual rewrites.
- Call out any follow-up risks if the bug reveals a more systemic layout pattern.

## Output
- State the root cause clearly.
- Provide the fix patch or code changes required.
