---
name: accessibility-check
description: Audit frontend UI for accessibility issues such as color contrast, ARIA usage, labeling, focus handling, and keyboard navigation. Use when reviewing a screen or component for a11y risks, preparing fixes, or validating that interactive UI is usable beyond pointer input.
---

# Accessibility Check

Review the UI for practical accessibility issues and propose concrete fixes.

## Workflow
- Inspect semantics, labels, heading structure, and interactive control roles.
- Check keyboard reachability, visible focus states, and tab order expectations.
- Review color contrast and non-color-only communication cues.
- Flag ARIA misuse and prefer native HTML behavior where possible.
- Prioritize issues by user impact and implementation effort.

## Output
- Provide a concise list of issues.
- Provide the code-level fixes or remediation guidance.
