# Onboarding Digital Anchoring

Date: 2026-04-13

## Summary

This note describes a software-first onboarding strategy for collecting initial taste data before hardware-based calibration exists.

Instead of asking users to rate taste with abstract `1-10` numbers, the idea is to anchor each taste axis to a familiar food or drink reference point that many Korean users already know.

The goal is to reduce cold-start friction while still collecting useful relative taste preference data.

## Core Idea

Each taste axis uses a familiar baseline food or drink as the `0` point.

Users then respond on a relative spectrum, for example `too strong -> just right -> not strong enough`, instead of trying to guess a raw numeric score.

This makes the first profile feel lighter, faster, and more human than a generic questionnaire.

## Six-Taste Anchor Examples

Each axis is intended to use a `-3` to `+3` relative slider around a known baseline.

### Salty

- Baseline: Shin Ramyun broth, standard recipe
- Spectrum: `[-3] too salty <- [0] just right -> [+3] too bland`

### Bitter

- Baseline: Starbucks Americano, tall size, default two shots
- Spectrum: `[-3] too bitter <- [0] pleasant -> [+3] too light`

### Sweet

- Baseline: Binggrae banana milk
- Spectrum: `[-3] too sweet <- [0] pleasantly sweet -> [+3] not sweet enough`

### Sour

- Baseline: standard burger-shop pickle or lemonade
- Spectrum: `[-3] dislike it <- [0] enjoy it normally -> [+3] actively seek strong acidity`

### Fat

- Baseline: the first rich bite of grilled pork belly
- Spectrum: `[-3] too rich <- [0] pleasantly rich -> [+3] not rich enough`

### Umami

- Baseline: Pyongyang naengmyeon broth or another light clear meat broth
- Spectrum: `[-3] too flat <- [0] gently present -> [+3] strongly reactive to depth`

## UI Guidance

This onboarding should feel like a calm calibration flow, not a hospital intake form.

Related source-of-truth docs:

- Product UX guideline: [`../../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](../../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
- Visual design system: [`../../DESIGN.md`](../../DESIGN.md)

Recommended interface rules:

1. One question per page to reduce cognitive load.
2. Use the Taste Buddy shell and card system, not a generic survey layout.
3. Use the relevant taste color on the active slider track.
4. After all six questions, convert the answers into the first radar-style taste profile view.

## Why This Matters

- Reduces cold-start friction
- Makes onboarding easier to understand
- Produces more useful relative preference data
- Feels more like premium calibration and less like a quiz

## Possible Next Steps

- behavior-based threshold questions
- extreme-spectrum limit tests
- taste resolution tests like blind comparisons
