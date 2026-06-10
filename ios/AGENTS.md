# Taste Buddy iOS Rules

These rules apply inside `ios/` in addition to the repository-level instructions.

- Keep the native app independent from the React build. Shared behavior should be mirrored through documented contracts and tests, not imports across platforms.
- Use SwiftUI and the product components in `TasteBuddy/Components` before creating screen-local visual patterns.
- Keep native colors, spacing, radius, and typography aligned with `TasteBuddy/DesignSystem/TBTheme.swift` and the root design system sources.
- Product text must remain calm, premium, and interpretation-first. Do not present calibration scores as medical or objective truth.
- The current native product scope excludes reservation and Tastick connectivity. Do not expose placeholder tabs or disabled actions for them.
- Preserve the learning loop: calibration, profile interpretation, dining feedback, and profile refinement.
- Add a focused `#Preview` for reusable product components and meaningful screen states.
- Run an iOS build and unit tests when Xcode and an iOS Simulator SDK are available. Otherwise, run the documented Swift typecheck and report the environment limitation.
