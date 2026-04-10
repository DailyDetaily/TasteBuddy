# Taste Buddy Design System

## Source Of Truth

This file is the current product design source of truth for Taste Buddy.

- `DESIGN.md` defines the product-level visual system, market position, safe choices, and deliberate risks.
- `src/styles/design-system.css` and `src/constants/designTokens.ts` are the implementation source of truth for tokens.
- This file replaces the old split between "design direction" and "design system guidelines." There should be one living visual system document.
- All product-facing color guidance should be readable from this file alone, including neutrals, taste colors, and hospitality support colors.
- No typography in product UI may exceed `18px`.

## What This Product Is

Taste Buddy is not a generic booking app.

It is a premium dining personalization service. The job is simple to say and hard to do well:

1. understand a diner's palate
2. translate it into something a chef can actually use
3. make the next dining experience feel better matched

That means the UI cannot feel like a medical dashboard.

It also cannot feel like a social restaurant feed.

It needs to feel like a calm hospitality instrument.

## Market Read, April 2026

I looked at the closest products and adjacent leaders.

### Reservation / Discovery

- [OpenTable new look](https://www.opentable.com/m/otnewlook/) says its redesign is "clean, crisp, contemporary" and "airy," with stronger menus, photos, and visible verified reviews.
- [OpenTable + Perplexity](https://www.opentable.com/restaurant-solutions/resources/perplexity/) shows where the market is heading: AI-assisted restaurant discovery tied directly to reservation inventory.
- [Resy Android relaunch, April 20, 2025](https://blog.resy.com/newsroom/resy-relaunches-resy-for-android/) emphasizes discovery, editorial collections, map filters, Notify, and access to over 20,000 restaurants.
- [Tock's new app](https://www.exploretock.com/join/resources/tock-app-store-ios/) pushes discovery harder and lets guests personalize profiles with dietary restrictions, allergies, special occasions, and wine preferences.

### Taste / Preference / Recommendation

- [Beli](https://beliapp.com/Beli) is built around track, share, discover. Its app store page adds `Taste Profile` and `Match Score` as core features.
- [Vivino](https://apps.apple.com/us/app/vivino-drink-the-right-wine/id414461255) centers scanning, pairing, personal taste memory, and a `Match for You` score, backed by 70 million users.

### Accessibility / Product Maturity

- [OpenTable accessibility statement, June 2025](https://www.opentable.com/c/legal/accessibility-statement/) explicitly aligns to WCAG 2.2 AA, zoom support, responsive font scaling, and not relying on color alone.

## Three-Layer Synthesis

### Layer 1, table stakes

Every serious product in this space converges on the same basics:

- bright, airy surfaces
- quick search and filtering
- strong restaurant imagery
- obvious reservation actions
- profile data folded into the booking flow
- post-visit feedback loops

If Taste Buddy ignores these, it looks underbuilt.

### Layer 2, current direction of the market

The category is moving toward:

- AI-assisted discovery
- richer guest profiles
- explainable personalization
- lightweight social proof
- more useful post-visit memory

Not just "book a table." More "help me choose well."

### Layer 3, first-principles read for Taste Buddy

This is the interesting part.

Everyone else is optimizing for discovery, reviews, and convenience.

Taste Buddy has a more unusual asset: measured or learned palate data that can be turned into chef-usable context.

That is the whole game.

The UI should not present taste data as trivia.

It should present it as translation.

## Eureka

The market assumes a diner's main problem is picking the right place.

Taste Buddy's user has a deeper problem: "Will this dining experience actually land well for me, and can the chef understand why?"

So the visual system should sit between premium reservation UX and calm interpretation UX.

Less feed.

Less lab.

More trusted translation layer.

## Design Direction

### Name

Quiet Hospitality Intelligence

### Aesthetic

Restrained, premium, readable.

Not flashy. Not playful. Not cold.

Think modern dining service with just enough sensory warmth to feel human.

### Decoration

Intentional, not empty.

Use very light atmosphere:

- soft stage gradients
- faint warmth in reservation and chef-facing moments
- controlled taste-color glows
- image crops that feel editorial, not marketing-stock

No ornamental clutter.

### Layout

Phone-first, framed on larger screens.

Mobile should remain the primary composition model. Tablet and desktop should feel like the phone UI placed on a well-designed stage, not stretched until it looks unfinished.

### Color

Keep the current neutral system. It is already close to where it should be.

Do not replace the taste palette. Keep it.

Add one secondary warmth layer for hospitality moments.

The color system should be read as one stack:

1. neutral system for most UI structure
2. taste palette for meaning
3. warm hospitality layer for selective emotional tone

#### Core neutrals, stable

- Page: `#F3F3F3`
- Surface: `#FFFFFF`
- Primary text: `#0F0F0F`
- Body text: `#666666`
- Default border: `#E7E7E7`

#### Taste palette, core product meaning

These remain first-class product colors.

They are not decorative accents. They are the semantic language of the product.

| Taste | Main | Light | Background | Use |
| --- | --- | --- | --- | --- |
| Sweet / 단맛 | `#FF9900` | `#FFCC80` | `#FFEBCC` | strongest highlight, active taste comparison, radar emphasis |
| Sour / 신맛 | `#FBC02D` | `#FDD835` | `#FFF7CC` | brightness, finish, lift, freshness cues |
| Bitter / 쓴맛 | `#95C900` | `#E6EE9C` | `#EAF4CC` | contrast, bitterness, roast-like friction notes |
| Salty / 짠맛 | `#7299FF` | `#90CAF9` | `#E3EBFF` | structure, edge definition, sharper delivery notes |
| Umami / 감칠맛 | `#B372B4` | `#CE93D8` | `#F0E3F0` | depth, savoriness, core body, longer flavor arc |
| Fat / 지방맛 | `#95867A` | `#BCAAA4` | `#EAE7E4` | richness, texture, roundness, lingering finish |

Taste palette rules:

- taste color is for meaning, not decoration
- use taste color on values, nodes, labels, chips, delta indicators, and chart signals
- do not set long body paragraphs in taste color
- do not flood a single dense block with all six taste colors at once
- default UI states should still start from neutral, success, warning, then taste palette when taste meaning is the point

#### Warm hospitality extension, new

These are not primary brand colors. They are support tones.

- Linen: `#F7F3EC`
- Sand: `#EFE7DA`
- Bronze: `#9A6B34`
- Roast: `#5C4738`

Use them only in:

- reservation promise cards
- chef translation cards
- empty states that need warmth
- confidence / refinement moments

Never let the warmth layer overpower the taste palette.

Practical hierarchy:

- if the UI is explaining taste, use the taste palette
- if the UI is framing care, anticipation, or hospitality, use the warm layer
- if the UI is doing neither, stay neutral

### Typography

Keep a one-font product UI.

That is the right call here.

Pretendard stays the primary family because it is readable, fast to implement, stable in Korean product UI, and already deeply present in the app.

Do not add a display serif to the product app.

That would be a design move in search of a product reason.

#### Type roles

| Role | Size | Weight | Line Height | Use |
| --- | --- | --- | --- | --- |
| Hero | 18px | 700 | 1.2 | completion, key intro, strongest card title |
| Heading | 18px | 700 | 1.35 | section title, flow title |
| Section | 16px | 700 | 1.35 | local subsection heading |
| Body | 14px | 400 | 1.5 | default copy |
| Body Strong | 14px | 600 | 1.45 | emphasis inside body |
| Caption | 12px | 600 | 1.4 | meta, badge, helper |
| Micro | 10px to 11px | 500 to 600 | 1.3 to 1.4 | tiny labels only |

#### Type rules

- Nothing above `18px`
- One screen gets at most two real heading levels
- Numeric readouts use tabular figures where possible
- Hierarchy comes from grouping, spacing, contrast, and placement, not giant text

### Spacing

The current rhythm is good. Keep it tight.

- Base inset: `12px`
- Page gutter: `20px`
- Section gap: `24px` standard, `32px` only for major transitions
- Sticky action reserve zone: minimum `140px`

### Radius

Keep the current radius family. It is already distinctive without being toy-like.

- Primary card shell: `20px`
- Internal support surfaces: `12px` to `14px`
- Media / immersive sheet: `24px`

### Motion

Keep calm motion. Tighten intent.

- `180ms` to `300ms` for interaction feedback
- `500ms` to `620ms` for screen or sheet state changes
- no bounce for decision-making flows
- looped motion only when it teaches device state or taste activity

## Shell System

### Tab Shell

Use for `Home`, `Analysis`, `Reservation`, `Profile`.

- background stays gray
- content sits in white cards
- large-screen container max: `1160px`
- main content rail: `420px` to `560px`
- support rail: `280px` to `360px`

Do not just widen every card.

### Flow Shell

Use for onboarding, calibration, connect, measurement.

- white stage
- max readable width: `440px`
- hero, explanation, proof, CTA
- minimal chrome

### Conversion Shell

Use for improve-accuracy, confirmation, upsell moments.

- white or linen stage
- max content width: `520px`
- one dominant promise block
- one proof stack
- one strong action

### Drawer / Sheet Shell

Use for menus, connection steps, quick branching tasks.

- sheet surface: white
- clear top handle
- no dashboard chrome inside
- titles stay short

## Product Patterns That Must Exist

These are missing or underdeveloped in the current app.

### 1. Explainable Personalization

Every major recommendation should answer:

- what we know
- what it means
- what happens next

This should be a repeatable card pattern.

### 2. Confidence Visibility

The profile should clearly show whether it is:

- Starter
- Building
- Refined

Not as a warning. As progress.

### 3. Chef Translation

This is the unique product pattern.

A card or block that turns taste data into chef-usable framing:

- likely sensitivity
- dining implication
- gentle calibration hint

### 4. Empty State With Momentum

Empty screens should never stop at "nothing here yet."

They should always show:

- what this screen will become
- how to get there
- one next action

### 5. Post-Dining Learning Loop

Feedback should feel like investing in a better next meal, not filling out admin.

## Component System

Build around these shared product components:

1. `AppShell`
2. `FlowShell`
3. `BottomStickyAction`
4. `ScreenHero`
5. `SystemEmptyState`
6. `ProfileConfidenceCard`
7. `ChefTranslationCard`
8. `ReservationPromiseCard`
9. `TasteEvidenceCard`
10. `InsightCard`
11. `MetricDeltaCard`
12. `StageProgressCard`
13. `DeviceStatusCard`
14. `PostDiningFeedbackPrompt`

## Data Visualization Rules

Taste Buddy should not use data-viz for decoration.

Use charts only when they do one of three jobs:

1. show relative taste balance
2. show change over time
3. show confidence and refinement

Rules:

- keep grid lines neutral
- use taste colors as signals, not as full chart backgrounds
- put interpretation next to every chart
- never force the user to decode raw numbers alone

## Imagery Rules

The category winners all lean heavily on photography.

Taste Buddy should use imagery differently.

Use:

- plated details
- hands, tools, textures
- close crops that suggest craft
- restaurant atmosphere as support

Avoid:

- generic smiling diners
- lifestyle hero shots
- saturated food posters
- giant full-bleed imagery inside dense product tasks

## Accessibility Rules

Taste Buddy should match current category maturity here, not lag behind it.

- design against WCAG 2.2 AA
- never rely on taste color alone
- preserve zoom and font scaling
- minimum tap target `44px`
- visible focus states
- clear error and success language
- charts must have text interpretation

## Implementation Specification

This section absorbs the old implementation-side design system rules into the same document.

Use it when turning the product direction above into code.

### Token Model

- semantic UI tokens use `--tb-color-*`, `--tb-space-*`, `--tb-radius-*`, `--tb-font-size-*`, `--tb-motion-*`
- domain-specific taste tokens use `--tb-taste-{taste}-{role}` plus `TASTE_TOKENS` and `TASTE_COLORS`
- token source files are:
  - `src/constants/designTokens.ts`
  - `src/styles/design-system.css`
  - `src/constants/tasteColors.ts`
- UI-common values should be semantic tokens first
- taste colors are product-domain tokens, not generic semantic state colors
- before adding a new token, solve it with the current token set unless the same exception appears at least twice
- legacy display aliases `20`, `22`, `24`, and `28` are intentionally mapped to `18px`

#### Semantic Color Tokens

Surface and background tokens:

| Token | Value | Role |
| --- | --- | --- |
| `--tb-color-bg-page` | `#F3F3F3` | page background |
| `--tb-color-surface-base` | `#FFFFFF` | app bar, drawer, primary surface |
| `--tb-color-surface-card` | `#FFFFFF` | default card shell |
| `--tb-color-surface-card-hover` | `#FAFAFA` | interactive card hover |
| `--tb-color-surface-muted` | `#F7F7F7` | muted support block |
| `--tb-color-surface-elevated` | `#FCFCFC` | raised support surface |
| `--tb-color-surface-disabled` | `#EFEFEF` | disabled fill |
| `--tb-color-surface-overlay` | `rgba(255, 255, 255, 0.8)` | glass overlay surface |

Text tokens:

| Token | Value | Role |
| --- | --- | --- |
| `--tb-color-text-primary` | `#0F0F0F` | strongest text |
| `--tb-color-text-secondary` | `#3F3F3F` | secondary heading and icon pair |
| `--tb-color-text-tertiary` | `#535353` | tertiary label |
| `--tb-color-text-body` | `#666666` | body copy |
| `--tb-color-text-hint` | `#888888` | hint, helper, chart label |
| `--tb-color-text-disabled` | `#AFAFAF` | disabled text |
| `--tb-color-text-inverse` | `#FFFFFF` | text on dark fill |
| `--tb-color-text-subtle` | `rgba(15, 15, 15, 0.6)` | softened explanatory text |
| `--tb-color-text-muted` | `rgba(15, 15, 15, 0.5)` | muted support text |
| `--tb-color-text-faint` | `rgba(15, 15, 15, 0.4)` | faint metadata |

Border and icon tokens:

| Token | Value | Role |
| --- | --- | --- |
| `--tb-color-border-card` | `#F0F0F0` | image or framed card edge |
| `--tb-color-border-subtle` | `#E8E8E8` | chart grid, bar track |
| `--tb-color-border-default` | `#E7E7E7` | default divider or border |
| `--tb-color-border-strong` | `#E5E5E5` | stronger rail, handle, active support edge |
| `--tb-color-border-disabled` | `#E0E0E0` | disabled border |
| `--tb-color-border-avatar` | `rgba(15, 15, 15, 0.2)` | avatar border |
| `--tb-color-border-avatar-soft` | `rgba(15, 15, 15, 0.15)` | softer avatar border |
| `--tb-color-icon-primary` | `#3F3F3F` | default icon |
| `--tb-color-icon-hover` | `#6F6F6F` | hover icon |
| `--tb-color-icon-muted` | `#AFAFAF` | muted icon |

State tokens:

| Token | Value | Role |
| --- | --- | --- |
| `--tb-color-success` | `#2F8F5B` | positive state |
| `--tb-color-success-soft` | `#E6F4EC` | soft positive fill |
| `--tb-color-warning` | `#A8661A` | progress / caution state |
| `--tb-color-warning-soft` | `#FFF1DE` | soft warning fill |

### Type Implementation Notes

Current implementation scale:

| Token | Value | Role |
| --- | --- | --- |
| `--tb-font-size-10` | `10px` | tab labels, micro metadata |
| `--tb-font-size-11` | `11px` | dates, small subtitles |
| `--tb-font-size-12` | `12px` | badges, helper text |
| `--tb-font-size-13` | `13px` | card body copy |
| `--tb-font-size-14` | `14px` | default buttons, rows |
| `--tb-font-size-15` | `15px` | emphasized small heading |
| `--tb-font-size-16` | `16px` | section heading |
| `--tb-font-size-18` | `18px` | page / hero / key card heading |

Implementation rules:

- use `700` for page heading and the strongest card title
- use `600` for section titles, active labels, and emphasized inline copy
- use `500` for buttons and secondary actions
- use `400` for body and metadata
- keep page hierarchy to two heading levels max

### Spacing And Radius Specification

Implementation tokens:

- spacing: `2`, `4`, `6`, `8`, `10`, `12`, `16`, `20`, `24`, `40`
- radius: `6`, `8`, `10`, `12`, `14`, `20`, `24`, `full`

Rules:

- default page gutter is `20px`
- primary card inset is `12px`
- standard section rhythm is `24px`
- `32px` is reserved for major transitions only
- sticky action areas keep a minimum `140px` reserve zone
- `20px` is the signature shell radius
- `24px` is reserved for media frames, drawers, or immersive sheets

### Shadow Specification

| Token | Value | Role |
| --- | --- | --- |
| `--tb-shadow-hover` | `0 1px 3px rgba(15, 15, 15, 0.06)` | subtle card lift |
| `--tb-shadow-soft` | `0 4px 20px rgba(0, 0, 0, 0.1)` | standard floating surface |
| `--tb-shadow-strong` | `0 12px 32px rgba(15, 15, 15, 0.12)` | stronger emphasis lift |
| `--tb-shadow-button` | `0 8px 20px rgba(0, 0, 0, 0.1)` | primary button |
| `--tb-shadow-drawer` | `0 20px 60px rgba(0, 0, 0, 0.24)` | drawer or deep overlay |

Rules:

- prefer tone contrast before shadow
- cards should not feel permanently elevated
- use strong shadow only when the layer relationship is truly important

### Motion Implementation Notes

Motion token table:

| Token | Value | Use |
| --- | --- | --- |
| `--tb-motion-duration-fast` | `180ms` | press, hover, color transition |
| `--tb-motion-duration-normal` | `300ms` | card and indicator transition |
| `--tb-motion-duration-medium` | `500ms` | medium state transition |
| `--tb-motion-duration-slow` | `620ms` | screen or drawer-linked transition |
| `--tb-motion-duration-slowest` | `720ms` | large radius transform |
| `--tb-motion-duration-loop-pulse` | `1600ms` | taste pulse |
| `--tb-motion-duration-splash` | `2500ms` | splash reveal |

Motion scales and distances:

- `press`: `0.98`
- `tabHover`: `1.05`
- `tabActive`: `1.1`
- `loopNodePulse`: `1.28`
- `loopLabelPulse`: `1.06`
- `xSmall`: `8px`
- `small`: `12px`
- `medium`: `20px`
- `large`: `40px`
- `onboardingSwipe`: `100px`

Spring defaults:

- `screenDamping`: `25`
- `screenStiffness`: `200`

Implementation rules:

- default interaction easing is `ease`
- entry / expand easing uses `cubic-bezier(0.22, 1, 0.36, 1)`
- common movement distances are `8px`, `12px`, and `20px`
- press scale must not exceed `0.98`
- tab / icon hover scale should cap around `1.05`, active around `1.1`
- looped pulse is reserved for taste activity or device-state teaching
- data and analysis motion must not use bounce, elastic, or overshoot

Keyframe guidance:

- prefer simple two-keyframe reveal motion
- plan animation in both frames and milliseconds when documenting it
- use `60fps` as the mental model
- analysis and chart reveals should complete together unless there is a strong comprehension reason not to

### Core Component Specification

#### App Shell

- overall app frame max width: `1440px`
- composition stays mobile-first even on larger screens
- desktop should feel framed, not stretched

#### Top App Bar

- height: `56px`
- horizontal inset: `20px`
- translucent page-tone background with blur is allowed
- left side holds avatar or back affordance
- right side holds 2 to 3 line icons
- preferred visual treatment is page-tone glass with roughly `0.8` alpha

#### Bottom Tab Bar

- translucent page-tone background with subtle top border
- icon size: `24px`
- label size: `10px`
- inactive uses muted gray, active uses black
- the home indicator remains a black pill unless the shell system is redesigned more broadly
- bottom indicator width is currently `134px`

#### Cards

- `SectionCard` is the default shell
- shell radius: `20px`
- internal support surfaces use white or muted neutral surfaces at `12px` to `14px`
- only interactive cards get hover tone changes
- card background token is `surface.card`
- default internal padding token is `12px`

#### Buttons

- primary button uses black fill, white text, `48px` height, `10px` radius
- compact button must still stay at least `40px` tall
- disabled buttons drop to surface gray and lose strong shadow
- primary button token pair is `text.primary` on `text.inverse`

#### Chips And Badges

- `OutlineBadge`: `12px`, `6px` radius, thin border
- `StatusChip`: fixed typography and size, state changes through fill and text color only
- home `TCS` badge can use weighted taste gradients based on adjustment ratios
- `TasteChip` uses very light taste tint fills and restrained borders
- badge padding uses `8px` inline and `2px` block
- pill radius uses `9999px`
- home `TCS` gradient should use each taste `light` color mixed with white by about `25%`
- weighted gradient boundaries should be soft, not hard-cut

#### Section Title

- repeated in-screen headings should use `SectionTitle`
- `md` is `16px`
- `lg` is `18px`

#### Sticky Bottom CTA

- use a bottom fade to signal action zone, not content ending
- reserve at least `140px` for safe CTA landing

### Icon Specification

- primary icon families are `@fluentui/react-icons` and `lucide-react`
- icon size system:
  - `S`: `14`
  - `M`: `18`
  - `L`: `24`
- stroke weights:
  - thin: `1.5`
  - regular: `1.8`
  - medium: `2`
  - strong: `2.2`
  - completion / check emphasis: `3`
- icons should usually pair with text
- use taste color on icons only when the icon is communicating taste meaning
- icon containers:
  - `S`: `18`
  - `M`: `24`
  - `L`: `32`
- product UI should stay inside this `S/M/L` system by default

Default icon container sizes:

- `sm`: `18`
- `md`: `24`
- `lg`: `32`
- `xl`: `32`
- routine card, list, and inline actions should usually use `S` or `M`
- `L` is for back, close, tab, and stronger navigation affordances

### Data Visualization Specification

Shared rules:

- neutral gray builds the chart structure
- taste color carries the meaning layer
- readability beats ornament every time

#### Progress Bars

- height: `8px`
- track: neutral gray
- fill: taste main color
- value labels align right and can inherit the taste color
- track token is `#E8E8E8`

#### Radar Chart

- fixed six-axis hexagon structure
- chart size: `320px`
- grid: `#E8E8E8`
- reference / average area stays neutral gray
- current user area uses a Sweet-based highlight fill and stroke
- outer taste dots may use each taste color
- labels stay visually quiet
- average fill: `rgba(240, 240, 240, 0.6)`
- average stroke: `#D0D0D0`
- highlight fill: `rgba(255, 153, 0, 0.12)`
- highlight stroke: `#FF9900`
- label size: `9px`
- label color: `#888888`
- node size: `3`
- outer dot size: `8`

#### Weekly Trend Chart

- line width: `1px`
- dot size: `4px`
- active dot size: `5px`
- line colors can use the taste palette directly
- grid and tooltip treatment should stay neutral

#### Circular Taste Ring

- max size: `320px`
- outer ring thickness: `24px`
- node radius: `12px`
- step count: `10`
- guide dot size: `1`
- default pulse step count: `1`
- each taste owns its loop gradient, guide dot color, and node scale
- ring geometry should stay stable across tastes; change the color system, not the shape system

Layout geometry tokens:

- guide radius: `138`
- ring radius: `138`
- outer ring inset: `10`
- label offset: `4`
- guide dot gap: `3`

Taste loop palette appendix:

| Taste | Accent | Ordinal | Guide / ring base |
| --- | --- | --- | --- |
| Sweet / 단맛 | `#FF9500` | 첫 번째 | `#FF9900` on `#FFEBCC` |
| Sour / 신맛 | `#FFD600` | 두 번째 | `#FFD600` on `#FFF7CC` |
| Bitter / 쓴맛 | `#8CC600` | 세 번째 | `#95C900` on `#EAF4CC` |
| Salty / 짠맛 | `#5898FF` | 네 번째 | `#7299FF` on `#E3EBFF` |
| Umami / 감칠맛 | `#AF52DE` | 다섯 번째 | `#B372B4` on `#F0E3F0` |
| Fat / 지방맛 | `#8E8279` | 여섯 번째 | `#95867A` on `#EAE7E4` |

### Layout Token Appendix

| Token | Value | Role |
| --- | --- | --- |
| `screenMaxWidth` | `1440px` | overall app frame |
| `pageGutter` | `20px` | standard page inset |
| `sectionGap` | `32px` | large section separation token |
| `cardPadding` | `12px` | default card inset |
| `topAppBarHeight` | `56px` | app bar height |
| `primaryButtonHeight` | `48px` | primary button height |
| `bottomFadeMinHeight` | `140px` | sticky action reserve |
| `bottomIndicatorWidth` | `134px` | bottom home indicator |

### Quality Guardrails

- tinted taste surfaces with colored text must maintain at least `3:1` contrast
- dense cards should separate information with spacing before adding more borders
- one card should usually contain one taste accent layer, at most two
- charts, profile summaries, and analysis blocks must include text interpretation

### Source Files

Implementation references live in:

- `src/constants/designTokens.ts`
- `src/styles/design-system.css`
- `src/constants/tasteColors.ts`
- `src/components/system/*`
- `src/components/graphics/*`

## Safe Choices

These are the category-baseline choices. Users already expect them.

1. Airy white surfaces with strong photography support
Why: OpenTable, Resy, and Tock all converge here. It signals trust and ease.

2. Discovery and reservation in one continuous flow
Why: the market is collapsing the gap between browsing and booking.

3. Profiles inside the booking journey, not in a separate settings graveyard
Why: personalization only matters when it changes the next reservation.

4. Calm, obvious CTA hierarchy
Why: this category loses users fast when actions feel hidden or too clever.

## Risks Worth Taking

These are the moves that make Taste Buddy feel like itself.

### Risk 1, make chef translation a first-class surface

What it is:
Show palate interpretation and chef-usable guidance on Home, Reservation, and Analysis, not buried behind details.

Why it works:
No other product in this set owns this space clearly.

What you gain:
A distinct product story.

What it costs:
You have to design the explanations very carefully so they do not sound bossy or pseudo-medical.

### Risk 2, add a warm hospitality layer without changing the whole palette

What it is:
Introduce linen, sand, and bronze only in select moments.

Why it works:
It adds dining warmth without wrecking the current neutral system.

What you gain:
A more premium and memorable feeling.

What it costs:
The rules have to stay strict or the app turns muddy.

### Risk 3, frame large screens like a menu folio, not a stretched dashboard

What it is:
On larger screens, stage the phone-like flow inside a composed container with a support rail.

Why it works:
The current app feels stretched on tablet and desktop.

What you gain:
Higher craft, less dead space.

What it costs:
You need deliberate layout rules, not just `max-width` patches.

### Risk 4, replace empty states with future-state previews

What it is:
Show what the screen becomes once the loop starts working.

Why it works:
Taste Buddy sells a better next meal, not static information.

What you gain:
More momentum on first use.

What it costs:
More content and component work.

## Creative Experiments Worth Prototyping

These are not mandatory. They are good bets.

### 1. Reservation Promise Card

A hero card on reservation screens:

- what your current palate suggests
- what this restaurant can likely deliver well
- one chef-facing note

### 2. Taste Passport

A compact profile block that feels like a hospitality credential, not a quiz result.

### 3. Refinement Timeline

A small journey strip showing:

- starter profile
- first personalized booking
- first post-dining feedback
- refined profile

### 4. Why This Match

A short expandable explainer under chef or restaurant recommendations.

Not just "recommended for you."

More "recommended because your profile tends to respond well to..."

## Screen Priorities

### Home

Needs a stronger first read.

- show profile confidence clearly
- replace weak empty-loading states
- elevate the chef translation idea

### Analysis

Needs tighter hierarchy.

- fewer equally loud blocks
- one dominant interpretation card
- supporting charts after meaning

### Reservation

This is the biggest gap.

- build a pre-booking promise state
- show what gets personalized
- make empty states feel valuable

### Profile

Needs summary first, detail second.

- identity
- confidence
- latest measurement
- next refinement action

## Implementation Order

### Phase 1, low-risk system cleanup

- keep existing tokens
- add hospitality extension tokens
- standardize shell rules
- standardize empty state rules

### Phase 2, shared product components

- extract the 14 product components listed above
- break down `Home.tsx` and `AnalysisPage.tsx`

### Phase 3, high-impact screens

- redesign `Home`
- redesign `Reservation`
- rebalance `Analysis`

### Phase 4, large-screen pass

- apply framed desktop composition
- add support rails where useful

## Anti-Patterns

Do not do these.

- text larger than `18px`
- purple startup gradients
- decorative charts with no interpretation
- generic social-feed layouts
- medicalized language for taste data
- empty states that only say "nothing yet"
- stretched mobile cards on desktop
- using all six taste colors at once in a single dense block

## Practical Rule

If a new UI element makes the app look more like a booking app, it needs to prove why.

If it makes the app look more like a lab app, same problem.

Taste Buddy should feel like a premium dining service that happens to be powered by taste intelligence.

Not the other way around.
