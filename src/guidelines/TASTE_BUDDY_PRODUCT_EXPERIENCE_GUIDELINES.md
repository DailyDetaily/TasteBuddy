# Taste Buddy Product Experience Guidelines

Version: 1.0  
Status: Working Source of Truth  
Purpose: This document defines the product concept, experience principles, UX writing rules, product logic, and implementation constraints for Taste Buddy. Codex should use this document as the primary reference when generating, modifying, or reviewing product UX and product-facing content.

---

# 1. Product Definition

## 1.1 What Taste Buddy Is

Taste Buddy is a personalized dining service that helps translate a guest's taste profile into chef-usable guidance, so dining experiences can be better matched to the guest.

Taste Buddy connects:

- pre-dining taste calibration
- guest profile generation
- reservation personalization
- chef-facing calibration guidance
- post-dining feedback
- profile refinement over time

## 1.2 What Taste Buddy Is Not

Taste Buddy is **not**:

- a medical diagnostic tool
- a lab-grade taste measurement platform
- a generic restaurant booking app
- a "fun taste quiz" product
- a system that forces chefs to rewrite recipes for each guest

## 1.3 Product Positioning

Taste Buddy should be positioned as:

> A premium personalized dining experience service that helps guests feel understood and helps chefs deliver their intended culinary experience more precisely.

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
- "My dining experience can be better matched to me."
- "My feedback improves future dining."
- "This service becomes more accurate over time."

## 2.2 Chef / Restaurant Value

For chefs and restaurants, Taste Buddy should communicate:

- "Guest taste tendencies can be understood in a structured way."
- "Personalized hospitality can be delivered more precisely."
- "The chef's intended experience can be better received by each guest."
- "Guest dining data can improve future service quality."

## 2.3 Strategic Product Value

The product is strongest when it is understood as:

- a taste-to-chef translation layer
- a personalization engine for dining
- a learning loop, not a one-time measurement

---

# 3. Core Service Loop

Codex must preserve and reinforce this service loop:

1. Quick Taste Calibration
2. Taste Profile Creation
3. Reservation Personalization
4. Chef Calibration Guidance
5. Dining Experience
6. Post-Dining Feedback
7. Profile Refinement
8. Optional Precision Calibration (hardware, later)

The product should always feel like it is moving the user forward through this loop.

---

# 4. Core Users and Stakeholders

## 4.1 Primary User

### Guest / Diner

A user who wants a dining experience better matched to their taste preferences and sensitivities.

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

**Experience improvement comes before technical explanation.**

Never lead with hardware, measurement mechanics, or technical complexity.  
Lead with the value of a better-matched dining experience.

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

1. Why this improves dining
2. What profile is being formed
3. How the chef can use it
4. How future dining becomes better
5. Optional precision upgrades later

## 6.2 Calibration First, Not Survey First

The user should never feel they are filling out a generic form.  
Calibration should feel lightweight, guided, and meaningful.

## 6.3 Result Means Action

Profile results should always connect to:

- reservation personalization
- chef-ready guidance
- next-step usefulness

### 6.3.1 Special Notes Must Be Translation, Not Trivia

When the product shows a "Special Note" or an equivalent refined signal:

- it should represent a repeatable pattern in detailed taste elements, not a decorative side fact
- it should translate that pattern into chef-usable guidance for the next dining experience
- it should preserve chef autonomy by framing the signal as calibration support, not a recipe command
- it should show confidence or evidence level when the signal is still evolving
- it should clearly indicate how the signal is being used in reservation personalization or chef-facing delivery

## 6.4 Feedback Must Feel Valuable

Post-dining feedback must never feel like an admin task.  
It should feel like an investment in a better next experience.

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
- "This can help shape a better-matched dining experience."

Avoid:

- "You are definitely..."
- "This measurement proves..."
- "The chef should change the recipe..."

---

# 8. Information Architecture

## 8.1 Recommended Primary Navigation

- Home
- Profile
- Reservations
- History
- Settings (optional or secondary)

## 8.2 Core MVP Screens

These are the most important screens in the experience:

1. Splash / Entry
2. Onboarding
3. Quick Taste Calibration
4. Taste Profile Result
5. Chef-ready Calibration Summary
6. Reservation Personalization
7. Reservation Confirmation
8. Post-Dining Feedback
9. Profile Updated
10. Improve Accuracy (optional hardware upgrade path)

## 8.3 Screen Priority

### Highest Priority

- Onboarding
- Calibration
- Profile Result
- Reservation + Chef Guidance
- Feedback

### Medium Priority

- History
- confidence progression
- profile updates over time

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
- "Not enough data for a refined recommendation yet."

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
- next action third

## 10.3 Chef Calibration Card

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
- framed as future improvement
- never framed as admin work

## 10.6 Bottom Sheet

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
- connect output to likely dining guidance
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
- hospitality-centered tone
- optional hardware
- chef-respectful language

## 15.4 Prioritize These Screens

When improving the app, prioritize:

1. onboarding
2. calibration
3. profile interpretation
4. reservation personalization
5. feedback loop

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
- explain how the next dining experience changes

---

# 16. Do / Don't

## Do

- prioritize experience improvement over technical explanation
- show profile interpretation before raw data
- support chef intention
- communicate evolving confidence
- connect profile to concrete dining outcomes
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

- the user understands the service as a personalized dining experience, not only a taste measurement app

## Product Value

- the user can quickly see how the service may improve their next meal

## Chef Value

- chef-facing information feels respectful, useful, and operationally realistic

## UX Clarity

- the flow is understandable without technical explanation

## Learning Loop

- the service clearly communicates that it gets better through dining feedback over time

## Hardware Strategy

- the product remains valuable without hardware
- hardware feels like an enhancement, not a requirement

---

# 18. Reference Product Framing Sentence

Use this as the default internal summary:

> Taste Buddy is a premium personalized dining service that learns a guest's taste profile over time and helps chefs deliver a better-matched culinary experience.

---

# 19. Reference Short Product Description

Use this when a concise product explanation is needed:

> Taste Buddy helps guests and chefs meet in the middle by translating taste preferences into a more personalized dining experience.
