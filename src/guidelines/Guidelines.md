# Taste Buddy Design System

This system is extracted from the current Taste Buddy screens and shared components, not redesigned from scratch.

## Source Of Truth

The tokens and rules below come from the current implementation of:

- `src/components/SectionCard.tsx`
- `src/components/TopAppBar.tsx`
- `src/components/BottomTabBar.tsx`
- `src/pages/OnboardingScreen.tsx`
- `src/pages/TeastickConnectScreen.tsx`
- `src/pages/TasteMeasurementScreen.tsx`
- `src/pages/AnalysisPage.tsx`
- `src/pages/ReservationPage.tsx`
- `src/pages/ProfilePage.tsx`
- `src/imports/Home.tsx`
- `src/components/graphics/TasteCircularLoop.tsx`
- `src/components/graphics/TbCoreLoop.tsx`

Implementation files:

- `src/constants/designTokens.ts`
- `src/styles/design-system.css`

## 1. Color Tokens

### Neutral UI

| Token | Value | Current Use |
| --- | --- | --- |
| `--tb-color-bg-page` | `#FFFFFF` | Screen backgrounds, drawers, image surfaces |
| `--tb-color-surface-card` | `#F3F3F3` | Default cards, secondary surfaces, callout blocks |
| `--tb-color-surface-card-hover` | `#ECECEC` | Interactive card hover state |
| `--tb-color-surface-muted` | `#F5F5F5` | Checklist cards, muted blocks |
| `--tb-color-surface-elevated` | `#F6F6F6` | Active step card state |
| `--tb-color-surface-disabled` | `#F2F2F2` | Disabled primary buttons |
| `--tb-color-text-primary` | `#0F0F0F` | Main headings, buttons, active nav |
| `--tb-color-text-secondary` | `#3F3F3F` | Icons, secondary controls |
| `--tb-color-text-tertiary` | `#535353` | Outline badges, supporting labels |
| `--tb-color-text-body` | `#666666` | Intro and instructional copy |
| `--tb-color-text-disabled` | `#AFAFAF` | Inactive tabs, disabled labels |
| `--tb-color-text-subtle` | `rgba(15, 15, 15, 0.6)` | Body copy inside cards |
| `--tb-color-text-muted` | `rgba(15, 15, 15, 0.5)` | Metadata, timestamps, sublabels |
| `--tb-color-border-default` | `#E7E7E7` | Tab bar top border |
| `--tb-color-border-strong` | `#E5E5E5` | Active step borders, divider handles |
| `--tb-color-border-subtle` | `#E8E8E8` | Progress tracks, subtle separators |
| `--tb-color-border-card` | `#F0F0F0` | Photo cards and framed content |

### Taste Palette

| Taste | Main | Dark | Light | Background | Gradient |
| --- | --- | --- | --- | --- | --- |
| Sweet | `#FF9900` | `#CC7A00` | `#FFCC80` | `#FFEBCC` | `linear-gradient(135deg, #FF9900, #FFB84D)` |
| Sour | `#FBC02D` | `#C99A00` | `#FDD835` | `#FFF7CC` | `linear-gradient(135deg, #FBC02D, #FFD54F)` |
| Bitter | `#95C900` | `#6E9600` | `#E6EE9C` | `#EAF4CC` | `linear-gradient(135deg, #95C900, #AED581)` |
| Salty | `#7299FF` | `#4A70CC` | `#90CAF9` | `#E6F0FF` | `linear-gradient(135deg, #7299FF, #9FBFFF)` |
| Umami | `#B372B4` | `#8A5490` | `#CE93D8` | `#F0E3F0` | `linear-gradient(135deg, #B372B4, #CE93D8)` |
| Fat | `#95867A` | `#6B5E54` | `#BCAAA4` | `#EAE7E4` | `linear-gradient(135deg, #95867A, #B0A49A)` |

### Taste Measurement Ring Pattern

- The circular taste UI uses the same six taste families, but with dedicated measurement accents for the active state.
- Each taste keeps:
  - a soft ring base
  - a guide color
  - a ten-step node scale for progressive intensity
- These live in `TASTE_TOKENS[id].measurement.loop` inside `src/constants/designTokens.ts`.

## 2. Spacing Tokens

The app is built on a compact mobile spacing scale. The most repeated values are `12`, `20`, and `24`.

| Token | Value | Current Use |
| --- | --- | --- |
| `--tb-space-2` | `2px` | Small badge padding, micro gaps |
| `--tb-space-4` | `4px` | Tiny legend spacing, label stacks |
| `--tb-space-6` | `6px` | Onboarding indicators, tab label spacing |
| `--tb-space-8` | `8px` | Small icon gaps, chips |
| `--tb-space-10` | `10px` | Compact radius/padding relationships |
| `--tb-space-12` | `12px` | Card padding, inline card gaps |
| `--tb-space-16` | `16px` | Action icon gaps, medium inset spacing |
| `--tb-space-20` | `20px` | Standard page gutter |
| `--tb-space-24` | `24px` | Detail screen section spacing |
| `--tb-space-40` | `40px` | Large vertical offsets and edge-to-edge dividers |

## 3. Radius Tokens

| Token | Value | Current Use |
| --- | --- | --- |
| `--tb-radius-6` | `6px` | Outline badge corners |
| `--tb-radius-8` | `8px` | Small icon tiles, mini image corners |
| `--tb-radius-10` | `10px` | Primary buttons, stat tiles |
| `--tb-radius-12` | `12px` | Nested white info strips inside cards |
| `--tb-radius-14` | `14px` | Large list thumbnails |
| `--tb-radius-20` | `20px` | Default card shape across the app |
| `--tb-radius-24` | `24px` | Drawer sheets and large media frames |
| `--tb-radius-full` | `9999px` | Pills, avatars, tab indicator, taste nodes |

Rule: `20px` is the default product card radius. Only use `24px` when the surface behaves like a media frame or bottom sheet.

## 4. Typography Scale

Pretendard is the system font everywhere. Type is mostly bold and compact for headers, with lighter metadata beneath.

| Token | Value | Current Use |
| --- | --- | --- |
| `--tb-font-size-10` | `10px` | Tab labels, status chips, chart labels |
| `--tb-font-size-11` | `11px` | Metadata, timestamps, restaurant subtitles |
| `--tb-font-size-12` | `12px` | Badge text, helper text, small values |
| `--tb-font-size-13` | `13px` | Card body copy, list text |
| `--tb-font-size-14` | `14px` | Default button text, section rows |
| `--tb-font-size-15` | `15px` | Period labels, emphasized small headers |
| `--tb-font-size-16` | `16px` | Section highlights and summary titles |
| `--tb-font-size-18` | `18px` | Section titles on profile/reservation detail |
| `--tb-font-size-20` | `20px` | Profile names and key home headings |
| `--tb-font-size-22` | `22px` | Onboarding and connection drawer titles |
| `--tb-font-size-24` | `24px` | Main screen titles |
| `--tb-font-size-28` | `28px` | Success / completion headline |

Weights:

- `400`: body and metadata
- `500`: buttons and labels
- `600`: section emphasis
- `700`: page titles and high-priority values

Line-height:

- `tight` / `snug` for titles
- `normal` / `relaxed` for instructional and analytical copy

## 5. Component Guidelines

### Cards

- Use `SectionCard` for the default Taste Buddy card shell.
- Default card styling is:
  - `#F3F3F3` background
  - `20px` radius
  - `12px` internal padding
  - stacked content with `12px` gap
- Nested informational rows inside a card switch back to white and typically use `12px` radius.

### Buttons

- The main action style is black fill, white text, `52px` height, `10px` radius.
- Disabled primary buttons fade to `#F2F2F2` with `#AFAFAF` text and lose their shadow.
- Use `PrimaryButton` for full-width bottom actions and compact inline CTAs.

### Badges And Chips

- The `Super Taster+` badge is an outlined micro-badge:
  - `12px` text
  - `6px` radius
  - `#535353` border and text
- Use `OutlineBadge` for outline labels, `StatusChip` for state pills, and `TasteChip` for taste-specific chips.
- Reservation and status chips are fully pill-shaped with `10px` bold text.

### Top And Bottom Navigation

- Top app bar stays white with a `56px` height and `20px` horizontal padding.
- Bottom navigation uses a white surface, subtle top border, muted inactive icons, and a black home indicator.

### Circular Taste Measurement UI

- Geometry is fixed and should stay consistent across all tastes:
  - `320px` max size
  - `24px` outer ring thickness
  - `12px` node radius
  - `10` sequential steps
- Each taste ring uses:
  - a soft base ring
  - a guide-dot halo
  - a 10-step node ramp
  - an accent color for the active headline
- Reuse `TASTE_TOKENS[id].measurement.loop` instead of creating new per-screen ring values.
- Reuse `SectionTitle` for repeated section headings before introducing new one-off heading styles.

## 6. Layout Rules

- Default mobile page gutter: `20px`
- Standard page section rhythm: `32px`
- Detail pages can compress to `24px` between larger groups
- Sticky bottom action area keeps a `140px` minimum fade zone
- App shell max width: `1440px`
- Edge-to-edge horizontal scrollers should expand beyond the gutter with matching negative margins, as already used in analysis and home

## 7. CSS Variables And Code Usage

Use the CSS variable layer for styling and the TypeScript token layer for logic-heavy UI:

```css
:root {
  --tb-color-surface-card: #f3f3f3;
  --tb-color-text-primary: #0f0f0f;
  --tb-space-12: 12px;
  --tb-radius-20: 20px;
  --tb-size-primary-button-height: 52px;
}

.tb-section-card {
  background: var(--tb-color-surface-card);
  border-radius: var(--tb-radius-20);
}

.tb-primary-button {
  height: var(--tb-size-primary-button-height);
}
```

Use:

- `src/styles/design-system.css` for CSS variables and reusable classes
- `src/constants/designTokens.ts` for palette objects, spacing/radius/type tokens, and taste measurement loop data
- `src/constants/tasteColors.ts` for existing taste color helpers backed by the shared token source

Do not invent new taste hues, new card radii, or a second spacing scale unless the current UI changes first.
