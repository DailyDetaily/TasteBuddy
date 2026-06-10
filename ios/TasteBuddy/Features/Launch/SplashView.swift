import SwiftUI

struct SplashView: View {
    var autoplays = true
    var onComplete: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hasScheduledCompletion = false

    var body: some View {
        ZStack {
            TBColor.page.ignoresSafeArea()

            TasteBuddySplashLogo(autoplays: autoplays)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Taste Buddy 시작 화면")
        .onAppear {
            scheduleCompletionIfNeeded()
        }
    }

    private func scheduleCompletionIfNeeded() {
        guard autoplays, !hasScheduledCompletion else {
            return
        }

        hasScheduledCompletion = true
        DispatchQueue.main.asyncAfter(deadline: .now() + (reduceMotion ? 1.2 : 2.8)) {
            onComplete()
        }
    }
}

private struct TasteBuddySplashLogo: View {
    var autoplays: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var logoOpacity: Double = 0
    @State private var logoScale: CGFloat = 0.95
    @State private var symbolScale: CGFloat = 0
    @State private var symbolOffsetX: CGFloat = 68.5
    @State private var wordmarkOpacity: Double = 0

    private let logoSize = CGSize(width: 200, height: 81)
    private let symbolFrame = CGRect(x: 0, y: 0, width: 64, height: 72)
    private let wordmarkFrame = CGRect(x: 80, y: 0, width: 120, height: 81)

    var body: some View {
        ZStack(alignment: .topLeading) {
            Image("SplashSymbol")
                .resizable()
                .scaledToFit()
                .frame(width: symbolFrame.width, height: symbolFrame.height)
                .scaleEffect(symbolScale, anchor: UnitPoint(x: 31.5 / logoSize.width, y: 40.5 / logoSize.height))
                .offset(x: symbolOffsetX)

            Image("SplashWordmark")
                .resizable()
                .scaledToFit()
                .frame(width: wordmarkFrame.width, height: wordmarkFrame.height)
                .offset(x: wordmarkFrame.minX, y: wordmarkFrame.minY)
                .opacity(wordmarkOpacity)
        }
        .frame(width: logoSize.width, height: logoSize.height, alignment: .topLeading)
        .opacity(logoOpacity)
        .scaleEffect(logoScale)
        .accessibilityHidden(true)
        .onAppear(perform: startAnimation)
    }

    private func startAnimation() {
        guard autoplays, !reduceMotion else {
            logoOpacity = 1
            logoScale = 1
            symbolScale = 1
            symbolOffsetX = 0
            wordmarkOpacity = 1
            return
        }

        withAnimation(.easeOut(duration: 1.0)) {
            logoOpacity = 1
            logoScale = 1
        }

        withAnimation(.timingCurve(0.25, 1, 0.5, 1, duration: 0.75)) {
            symbolScale = 1
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.375) {
            withAnimation(.timingCurve(0.25, 1, 0.5, 1, duration: 1.125)) {
                symbolOffsetX = 0
            }

            withAnimation(.easeOut(duration: 1.125)) {
                wordmarkOpacity = 1
            }
        }
    }
}

#if canImport(PreviewsMacros)
    #Preview {
        SplashView(autoplays: false, onComplete: {})
    }
#endif
