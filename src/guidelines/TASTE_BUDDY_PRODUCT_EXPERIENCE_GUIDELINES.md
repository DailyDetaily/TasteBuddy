# Taste Buddy Product Experience Guidelines

Version: 1.1 · Product priorities updated: 2026-09-06

Status: Working Source of Truth  
Purpose: This document defines the product concept, experience principles, UX writing rules, product logic, and implementation constraints for Taste Buddy. Codex should use this document as the primary reference when generating, modifying, or reviewing product UX and product-facing content.

---

# 1. Product Definition

## 1.1 What Taste Buddy Is

Taste Buddy is a premium service whose first priority is to understand each user's palate and return varied, evidence-backed interpretations and insights about their preferences.

Product priorities, in order:

1. Understand the individual through lightweight records and provide meaningful interpretations and insights.
2. Later, connect the user with groups whose palate evidence shows relevant similarities, including where their preferences differ.
3. Add restaurant and menu recommendations grounded in those groups' recommendations, reviews, and explicit preferences.

The initial product must deliver personal insight value before group matching and recommendations are available. Reservation personalization, chef guidance, and hardware are extension capabilities. This priority update does not assert that the planned capabilities are already implemented.

## 1.2 What Taste Buddy Is Not

Taste Buddy is **not**:

- a medical diagnostic tool
- a lab-grade taste measurement platform
- a generic restaurant booking app
- a "fun taste quiz" product
- a system that forces chefs to rewrite recipes for each guest

## 1.3 Product Positioning

Taste Buddy should be positioned as:

> A premium palate insight service that helps people understand their preferences, then connect with similar palates and discover the restaurants and dishes those groups recommend.

## 1.4 Hardware Positioning

Hardware is **not a required entry point**.

The service must be valuable without hardware through profiling and feedback-based learning.

Hardware, if present, should be treated as:

- an optional precision layer
- an advanced calibration feature
- a premium extension of the core service

Hardware must never dominate the product narrative.

---

# 2. Core Value

## 2.1 Guest Value

For guests, Taste Buddy should communicate these values:

- "My palate is understood."
- "I can understand patterns, differences, and exceptions in what I enjoy."
- "One simple record can contribute to several useful insights."
- "My interpretation evolves as I add or correct experiences."

Later, group connection should help users understand what they share with other palates. Group-based restaurant and menu recommendations add discovery value after that foundation is established.

## 2.2 Chef / Restaurant Value

For chefs and restaurants, Taste Buddy should communicate:

- "Guest taste tendencies can be understood in a structured way."
- "Personalized hospitality can be delivered more precisely."
- "The chef's intended experience can be better received by each guest."
- "Guest dining data can improve future service quality."

## 2.3 Strategic Product Value

The product is strongest when it is understood as:

- a personal palate understanding and interpretation service
- a reusable evidence foundation for varied insights
- an evolving connection between individual preferences and similar-palate groups

---

# 3. Core Service Loop

Codex must preserve and reinforce this service loop:

1. Lightweight Entry and Taste Context
2. Dining Experience and Simple Feedback
3. Evidence Refinement with Source and Context Preserved
4. Personal Taste Understanding
5. Varied Interpretations and Insights
6. Optional Clarification, Correction, and Further Experience
7. Profile and Insight Refinement

Later extensions build on this loop: similar-palate group connection, followed by group-based restaurant and menu recommendations. Hardware and chef guidance remain optional extensions. The core loop must remain useful when no recommendation or social connection is shown.

---

# 4. Core Users and Stakeholders

## 4.1 Primary User

### Guest / Diner

A user who wants to understand what they enjoy, how preferences differ across foods and situations, and what their own dining records reveal.

## 4.2 Secondary User

### Chef / Restaurant Team

A restaurant-side stakeholder who may use guest calibration insights to improve hospitality and delivery of the intended dining experience.

## 4.3 Internal Product Perspective

Taste Buddy must balance:

- guest trust
- chef respect
- hospitality clarity
- product learning over time

---

# 5. Product Principles

These are the highest-level product rules. Codex should follow them before making product or UX decisions.

## Principle 1

**Personal taste understanding and insight come first.**

Never lead with hardware, measurement mechanics, or technical complexity.  
Lead with what the user can learn about their palate. Treat group connection and group-based recommendations as later product layers.

## Principle 2

**Interpretation matters more than raw numbers.**

Users should understand what their profile means in practice.  
Raw values alone are not enough.

## Principle 3

**The service should feel like it learns, not like it judges.**

Taste Buddy should feel adaptive, supportive, and gradually refining.

## Principle 4

**Chef intention must be respected.**

Taste Buddy is not a recipe override system.  
It is a calibration support layer.

## Principle 5

**A premium dining service should feel calm, clear, and intentional.**

The product should feel refined, not playful or gimmicky.

## Principle 6

**The service must remain useful without hardware.**

No critical product value should depend entirely on physical device connection.

---

# 6. UX Principles

## 6.1 Value Order

The UX must present value in this order:

1. What the user can understand about their own preferences
2. Which records support the interpretation and what remains uncertain
3. How patterns differ across foods, components, situations, and time
4. Later, which palate groups share relevant similarities and differences
5. Group-based restaurant and menu recommendations and optional service extensions

## 6.2 Calibration First, Not Survey First

The user should never feel they are filling out a generic form.  
Calibration should feel lightweight, guided, and meaningful.

## 6.3 Results Provide Understanding

Profile results should provide:

- clear interpretations grounded in the user's records
- useful patterns, contrasts, exceptions, and appropriately supported changes
- visible evidence scope and meaningful unknowns
- optional clarification or correction when it improves understanding

A result does not need a booking, recommendation, or chef handoff to provide value.

### 6.3.1 Refine Evidence for Multiple Outputs

- Preserve raw input and provenance while normalizing meaning into reusable observations.
- Keep sensation, intensity, liking, target, phase, food, and context distinct; preserve unknown values.
- Generate multiple views from the same valid evidence: experience summaries, sensory profiles, conditional insights, supported changes, and group-comparison features.
- Store output-specific wording, aggregation, and display vectors as derived views with evidence references and rule versions.
- New interpretations must not rewrite source observations or count as additional experiences. Corrections and deletions must propagate to dependent views.
- Expand useful perspectives when evidence allows. Output quantity alone is not evidence quality or product success.

### 6.3.2 Special Notes Explain Supported Patterns

When the product shows a "Special Note" or an equivalent refined signal:

- it should explain a supported preference pattern, contrast, exception, or unresolved question
- it should show the relevant food, component, situation, or time scope
- it should identify evidence and uncertainty without assigning unvalidated confidence scores
- if reused in a later chef-facing feature, it should preserve chef autonomy and identify the original evidence scope

## 6.4 Feedback Must Feel Valuable

Post-dining feedback must never feel like an admin task.  
It should help users learn something meaningful about their own preferences with little effort.

## 6.5 Confidence Should Be Visible

When data is limited, the product should communicate that the profile is still evolving.

Suggested labels:

- Starter Profile
- Building Profile
- Refined Profile

## 6.6 Avoid False Precision

Do not present numbers in a way that implies medical-grade or scientifically objective truth if the profile is derived from non-hardware inputs.

---

# 7. UX Writing Principles

## 7.1 Tone

Tone should be:

- calm
- premium
- clear
- respectful
- warm, but restrained
- expert without sounding clinical

## 7.2 Writing Goals

Writing should:

- explain what changes for the user
- reduce anxiety or confusion
- emphasize guidance, not diagnosis
- emphasize refinement, not certainty

## 7.3 Preferred Vocabulary

Use language such as:

- taste profile
- palate profile
- taste interpretation
- personal palate insights
- similar-palate groups
- calibration
- current profile
- refined profile
- chef-ready guidance
- dining preferences
- refined through feedback
- personalized dining experience

## 7.4 Avoid These Words or Tones

Do not use:

- diagnosis
- precise scientific measurement
- exact taste reading
- objective taste score
- medical claims
- "AI knows your taste exactly"
- command-like language toward chefs
- overconfident claims of certainty

## 7.5 Preferred Messaging Patterns

Preferred:

- "Your current profile suggests..."
- "Based on your responses..."
- "This profile becomes more accurate over time."
- "Here is a pattern in how you described these meals."
- "This preference appears in these foods; other contexts are still unclear."

Avoid:

- "You are definitely..."
- "This measurement proves..."
- "The chef should change the recipe..."

---

# 8. Information Architecture

## 8.1 Recommended Primary Navigation

- Home
- Taste Insights / Profile
- Dining Records / History
- Settings (optional or secondary)

Similar-palate groups and group-based recommendations are later layers. Existing platform navigation is governed by its implementation scope; this document does not require placeholder tabs or an immediate UI rearrangement.

## 8.2 Core MVP Screens

These are the most important screens in the experience:

1. Splash / Entry
2. Onboarding
3. Quick Taste Calibration
4. Taste Profile Result
5. Personal Taste Interpretations and Insights
6. Dining Record and Post-Dining Feedback
7. Insight Evidence and Optional Clarification
8. Profile Updated

Similar-palate groups, group-based recommendations, chef guidance, reservation flows, and hardware belong to later or platform-specific scopes.

## 8.3 Screen Priority

### Highest Priority

- Onboarding
- Calibration
- Taste Profile and Insights
- Lightweight Feedback and Records
- Evidence, Unknowns, and Corrections

### Medium Priority

- supported preference changes over time
- similar-palate group connection when the core insight experience is established
- group-based restaurant and menu discovery after group connection

### Lower Priority

- advanced stats
- decorative interactions
- social sharing
- gamification

---

# 9. State Design

Codex must account for product states, not only ideal flows.

## 9.1 Required States

- loading
- success
- empty
- error
- retry
- disconnected
- no dining history
- starter profile
- building profile
- refined profile
- no reservation available
- feedback submitted
- feedback skipped

## 9.2 State Behavior Principle

States must feel intentional and calm.  
They should support trust, not create friction.

## 9.3 Example State Labels

- "Your profile is still being refined."
- "No dining history yet."
- "Add one dining experience to improve your profile."
- "These records do not yet clarify this preference."

---

# 10. Component Intent Guidelines

This section defines the role and UX intent of major product components. It does not define visual design system details.

## 10.1 TasteMeasurementRing

### Purpose

Represents the user's current taste profile in a visually memorable way.

### Rules

- use consistent circular structure across all taste types
- labels must prioritize readability
- the component should feel like a profile representation, not a scientific instrument
- it must always be supported by interpretation text

### Do

- use it to show "current profile"
- use it with interpretation
- use it with confidence state

### Don't

- use it as proof of scientific certainty
- overload it with excessive numeric detail

## 10.2 Profile Summary Card

### Purpose

Translate profile data into understandable guidance.

### Rules

- interpretation first
- practical meaning second
- evidence scope and meaningful unknowns
- optional clarification or exploration when useful

## 10.3 Chef Calibration Card

This is an extension component for the platform scopes that include chef guidance.

### Purpose

Translate guest profile into chef-usable guidance.

### Rules

- preserve chef autonomy
- suggest, do not command
- focus on calibration, not recipe takeover

### Good Output Example

- prefers cleaner finish
- may be sensitive to heavy sweetness
- responds well to brighter acidity

### Bad Output Example

- reduce sugar by 20%
- rewrite this course for the guest

## 10.4 Reservation Personalization Card

This is an extension component for the platform scopes that include reservations.

### Purpose

Link profile to booking decisions.

### Rules

- clearly show how the profile influences the experience
- emphasize relevance, not overconfidence

## 10.5 Post-Dining Feedback Module

### Purpose

Capture high-value reflection with minimal burden.

### Rules

- brief
- meaningful
- framed as understanding one's palate and gaining useful interpretations
- never framed as admin work
- separate private learning signals from public review/social signals when the UI exposes both
- reflection photos should feel like memory aids for the dish card, not social proof or lifestyle content

### Taste Bubble Map Layout Rules

When post-dining feedback uses a bubble map for taste impressions:

- each taste axis should read as a compact triangular silhouette within the shared hex grid
- adding or removing bubbles must preserve the six triangular axis silhouettes before optimizing individual word proximity
- boundary words may move within the layout only when they smooth the axis silhouette, not when they make a single bubble protrude from its axis cluster
- slot overrides should be treated as visual silhouette corrections, not as changes to the word's taste axis, color, meaning, or chef-facing interpretation
- the full map should remain evenly spaced; never fix one protruding bubble by breaking the global hex-grid rhythm

## 10.6 Public Taste Profile / Match Feed

### Purpose

After the personal insight experience is established, connect users with similar-palate groups and explain relevant similarities and differences. Restaurant and dish discovery through those groups is an additional layer.

### Rules

- public profile must be opt-in and should expose interpreted taste identity before raw measurements
- group comparison must preserve evidence scope, missing information, and differences within a group
- group membership is revisable and must not replace the individual's own preference evidence
- group-based recommendations must distinguish explicit member recommendations, positive reviews, and inferred candidates
- match feed should explain why a review is relevant to the user's palate, not imply objective quality ranking
- similarity labels should be confidence-aware and respectful; avoid competitive follower/status framing
- saved restaurants should support future dining decisions and comparison, not behave like a generic booking wishlist

## 10.7 Bottom Sheet

### Purpose

Used for focused, contained flows and secondary overlays.

### Rules

- premium modal sheet feel
- clear hierarchy
- tactile and calm
- avoid clutter

---

# 11. Data Communication Rules

## 11.1 Data Meaning

All scores or indicators should be treated as profile indicators, not medical measurements.

## 11.2 Data Communication

Always pair profile-related information with:

- interpretation
- confidence
- practical implication

## 11.3 Confidence Levels

Suggested labels:

- Starter
- Building
- Refined

## 11.4 Avoid Overprecision

Avoid unnecessary decimal precision or language that implies scientific certainty without hardware-backed evidence.

---

# 12. Taste Profiling Rules

## 12.1 Taste Axes

Taste Buddy may use these taste categories in its profile system:

- Sweet
- Sour
- Bitter
- Salty
- Umami
- Fat / Richness

## 12.2 Product Framing

These should be framed as:

- user taste profile dimensions
- dining preference tendencies
- experiential calibration inputs

Not as:

- confirmed biological measurements
- clinical taste disorders
- objective medical sensitivity values

## 12.3 Cold Start Rules

When user data is minimal:

- generate a starter profile
- communicate evolving confidence
- provide useful interpretations within the available evidence and show meaningful unknowns
- avoid overclaiming

## 12.4 Learning Model Principle

Profile quality should improve through:

- calibration responses
- dining behavior
- post-dining feedback
- repeated usage
- optional precision calibration later

---

# 13. Chef / Restaurant Perspective Rules

## 13.1 Restaurant-Side Positioning

Taste Buddy should present itself to chefs and restaurants as:

- a hospitality support tool
- a guest understanding layer
- a calibration aid
- a delivery enhancement layer

## 13.2 What Not to Imply

Do not imply that:

- chefs must abandon their vision
- recipes should be rewritten per guest by default
- the app overrides chef expertise

## 13.3 Correct Framing

Correct framing:

- helps chefs deliver intended experience more precisely
- helps restaurants understand guest taste tendencies
- supports more personalized hospitality

## 13.4 Calibration Language

Always prefer:

- calibration
- guidance
- profile summary
- delivery adjustment
- preference note

Avoid:

- command
- instruction order
- mandatory recipe change

---

# 14. Hardware Extension Rules

## 14.1 Core Rule

The service must function without hardware.

## 14.2 Hardware Role

Hardware is:

- optional
- premium
- precision-oriented
- secondary to the main value proposition

## 14.3 Hardware Flow Placement

Hardware should appear as:

- "Improve accuracy"
- "Advanced calibration"
- "Precision taste device"
- "Optional upgrade path"

Hardware should not appear as:

- mandatory first-run step
- gatekeeper to the service
- required setup before understanding value

## 14.4 Messaging

Use:

- improve precision
- add finer calibration
- refine your profile

Avoid:

- complete your required measurement
- connect device to unlock the app
- no profile without hardware

---

# 15. Codex Build Rules

This section is directly for Codex behavior.

## 15.1 Source of Truth

When working on Taste Buddy:

- follow this guidelines document first
- follow approved product logic second
- follow existing approved components third

## 15.2 Reuse Before Reinventing

Codex must:

- reuse existing structures where possible
- preserve current service logic unless asked otherwise
- avoid introducing new interaction patterns without reason

## 15.3 Preserve Product Framing

All generated UI, content, or logic must preserve:

- profile-first framing
- personal understanding and varied insights before group matching and recommendations
- reusable refined evidence with traceable derived outputs
- hospitality-centered tone
- optional hardware
- chef-respectful language

## 15.4 Prioritize These Screens

When improving the app, prioritize:

1. profile interpretation and personal insights
2. lightweight dining records, feedback, and correction
3. onboarding and optional clarification
4. similar-palate group connection in a later phase
5. group-based restaurant and menu recommendations afterward

## 15.5 Do Not Drift Into These Directions

Do not drift toward:

- medical app UX
- quantified-self dashboard aesthetic
- generic restaurant booking app patterns
- playful consumer quiz app patterns
- overly gamified habit app patterns

## 15.6 Writing Constraints for Codex

Codex must:

- use calm, premium, precise language
- avoid overclaiming scientific certainty
- make value tangible in dining terms
- explain what the user can understand about their preferences and which experiences support it

---

# 16. Do / Don't

## Do

- prioritize personal taste understanding and useful insights
- show profile interpretation before raw data
- support chef intention
- communicate evolving confidence
- support multiple grounded interpretations from reusable refined evidence
- make post-dining feedback feel useful and rewarding

## Don't

- imply medical diagnosis
- overclaim scientific precision without hardware
- frame the service as "just a measurement app"
- command chefs to rewrite recipes
- overload the user with numbers
- make first-run setup too heavy
- make hardware feel mandatory

---

# 17. Success Criteria

Taste Buddy should be considered aligned when:

## User Understanding

- the user can understand the interpretation, identify the experiences supporting it, and distinguish facts from tentative patterns

## Product Value

- users gain useful, varied insights about preferences, conditions, and exceptions with little recording effort
- interpretations remain faithful to evidence and can be corrected when the user's meaning was misunderstood
- raw output count, booking conversion, and future meal satisfaction do not replace these primary criteria

## Later Group and Recommendation Value

- group connections explain useful palate similarities and differences within the available evidence
- restaurant and menu recommendations clearly identify their group evidence and are evaluated separately for discovery usefulness and dining satisfaction

## Chef Value

- chef-facing information feels respectful, useful, and operationally realistic

## UX Clarity

- the flow is understandable without technical explanation

## Learning Loop

- added, corrected, and deleted feedback updates the relevant interpretations and insights consistently

## Hardware Strategy

- the product remains valuable without hardware
- hardware feels like an enhancement, not a requirement

---

# 18. Reference Product Framing Sentence

Use this as the default internal summary:

> Taste Buddy is a premium service that understands each user's palate and returns varied, evidence-backed interpretations and insights, with similar-palate groups and group-based restaurant and menu recommendations as later extensions.

---

# 19. Reference Short Product Description

Use this when a concise product explanation is needed:

> Taste Buddy helps people understand their palate through meaningful interpretations and insights drawn from their dining experiences.
