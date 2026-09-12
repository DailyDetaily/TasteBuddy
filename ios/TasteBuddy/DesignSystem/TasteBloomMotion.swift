import SwiftUI
import UIKit

/// Taste Buddy의 동작 규칙. 화면은 속도나 곡선 대신 동작의 역할을 선택한다.
enum TasteBloomMotion {
    enum Role: CaseIterable {
        case press, feedback, content, sheet, bloom

        var duration: TimeInterval {
            switch self {
            case .press: Duration.press
            case .feedback: Duration.fast
            case .content: Duration.normal
            case .sheet: Duration.medium
            case .bloom: Duration.slowest
            }
        }
    }

    // iOS의 네이티브 스프링. 목표 근처에서 약 1.1%만 넘었다가 부드럽게 안착한다.
    static let bounce = 0.18
    static let stagger: TimeInterval = 0.06

    static func spring(_ role: Role) -> Spring {
        Spring(duration: role.duration, bounce: bounce)
    }

    static func duration(_ role: Role, reduceMotion: Bool) -> TimeInterval {
        // 역할은 체감 시간, 시퀀스의 완료 시계는 네이티브 모델의 안착 시간을 쓴다.
        reduceMotion ? 0 : spring(role).settlingDuration
    }

    static func animation(_ role: Role, reduceMotion: Bool) -> Animation? {
        guard !reduceMotion else { return nil }
        return .spring(spring(role))
    }

    static func layerAnimation(_ role: Role, keyPath: String) -> CASpringAnimation {
        let spring = spring(role)
        let animation = CASpringAnimation(keyPath: keyPath)
        animation.mass = spring.mass
        animation.stiffness = spring.stiffness
        animation.damping = spring.damping
        animation.duration = spring.settlingDuration
        return animation
    }

    @MainActor
    static func animator(
        _ role: Role, animations: @escaping () -> Void
    ) -> UIViewPropertyAnimator {
        let spring = spring(role)
        let parameters = UISpringTimingParameters(
            mass: spring.mass, stiffness: spring.stiffness, damping: spring.damping,
            initialVelocity: .zero
        )
        let animator = UIViewPropertyAnimator(duration: spring.settlingDuration, timingParameters: parameters)
        animator.addAnimations(animations)
        return animator
    }

    static func progress(_ value: Double, role: Role = .bloom) -> Double {
        guard value > 0 else { return 0 }
        guard value < 1 else { return 1 }
        let spring = spring(role)
        return spring.value(target: 1, time: value * spring.settlingDuration)
    }

    static func reveal(reduceMotion: Bool) -> AnyTransition {
        reduceMotion ? .opacity : .opacity.combined(with: .offset(y: Distance.xSmall))
    }

    static func questionReveal(reduceMotion: Bool, index: Int = 0) -> AnyTransition {
        guard !reduceMotion else { return .opacity }
        return .asymmetric(
            insertion: .opacity.combined(with: .offset(y: -Distance.medium))
                .combined(with: .scale(scale: 0.97, anchor: .top))
                .animation(animation(.sheet, reduceMotion: false)?.delay(Double(index) * stagger)),
            removal: .opacity.combined(with: .offset(y: -Distance.xSmall))
                .animation(animation(.content, reduceMotion: false))
        )
    }

    static func chartIsVisible(size: CGSize, viewport: CGRect?) -> Bool {
        guard size.width > 0, size.height > 0 else { return false }
        let bounds = CGRect(origin: .zero, size: size)
        let visible = bounds.intersection(viewport ?? bounds)
        return visible.width > 0 && visible.height >= min(size.height * 0.15, 40)
    }

    static func sheetTransition(reduceMotion: Bool) -> AnyTransition {
        // 시트는 화면 아래로 내려가며 닫힌다. 배경과의 앞뒤 관계를 유지한다.
        reduceMotion ? .opacity : .move(edge: .bottom)
    }

    // 기존 TBMotion 이름과 디자인 토큰 참조도 이 값으로 연결된다.
    enum Duration {
        static let press: Double = 0.12
        static let fast: Double = 0.18
        static let normal: Double = 0.30
        static let medium: Double = 0.50
        static let slow: Double = 0.62
        static let slowest: Double = 0.72
        static let loopPulse: Double = 1.60
        static let splash: Double = 2.50
    }

    enum Scale {
        static let press: CGFloat = 0.98
        static let budPeak: CGFloat = 1.018
        static let tabHover: CGFloat = 1.05
        static let tabActive: CGFloat = 1.10
        static let loopNodePulse: CGFloat = 1.28
        static let loopLabelPulse: CGFloat = 1.06
    }

    enum Distance {
        static let xSmall: CGFloat = 8
        static let small: CGFloat = 12
        static let medium: CGFloat = 20
        static let large: CGFloat = 40
        static let onboardingSwipe: CGFloat = 100
    }
}

private struct TasteBloomMotionModifier<Value: Equatable>: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let role: TasteBloomMotion.Role
    let value: Value

    func body(content: Content) -> some View {
        content.animation(TasteBloomMotion.animation(role, reduceMotion: reduceMotion), value: value)
    }
}

private struct TasteBloomReplaceModifier<Value: Hashable>: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let value: Value

    func body(content: Content) -> some View {
        ZStack {
            content
                .id(value)
                .transition(reduceMotion ? .opacity : .opacity.combined(with: .scale(scale: 0.9)))
        }
        .tasteBloomMotion(.feedback, value: value)
    }
}

private struct TasteBloomChartRevealModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var revealed = false
    let anchor: UnitPoint
    let enabled: Bool

    func body(content: Content) -> some View {
        let progress: CGFloat = revealed || reduceMotion || !enabled ? 1 : 0
        content
            .mask {
                Rectangle().scaleEffect(
                    x: anchor == .bottom ? 1 : progress,
                    y: anchor == .leading ? 1 : progress,
                    anchor: anchor
                )
            }
            .onGeometryChange(for: Bool.self) { proxy in
                TasteBloomMotion.chartIsVisible(size: proxy.size, viewport: proxy.bounds(of: .scrollView))
            } action: { visible in
                guard visible, !revealed else { return }
                withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                    revealed = true
                }
            }
    }
}

extension View {
    /// 바뀌는 상태를 지정해 해당 UI에만 모션을 적용한다. 동작 줄이기는 자동 반영한다.
    func tasteBloomMotion<Value: Equatable>(
        _ role: TasteBloomMotion.Role, value: Value
    ) -> some View {
        modifier(TasteBloomMotionModifier(role: role, value: value))
    }

    /// 실제 스크롤 노출 시 최종 데이터 형태를 마스크로 드러낸다. 값 자체는 보간하지 않는다.
    func tasteBloomChartReveal(from anchor: UnitPoint = .leading, enabled: Bool = true) -> some View {
        modifier(TasteBloomChartRevealModifier(anchor: anchor, enabled: enabled))
    }

    /// 내부 상태가 없는 아이콘 교체에 사용한다. 입력 필드나 화면 전체에는 적용하지 않는다.
    func tasteBloomReplace<Value: Hashable>(value: Value) -> some View {
        modifier(TasteBloomReplaceModifier(value: value))
    }
}

#Preview("그래프 등장 모션") {
    ScrollView {
        HexRadarChart(profile: .sample)
            .padding(TBSpacing.page)
    }
}

#Preview("TasteBloomMotion") {
    TasteBloomMotionPreview()
}

private struct TasteBloomMotionPreview: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var selected = false
    @State private var expanded = false
    @State private var selectedPeriod = 0

    var body: some View {
        VStack(spacing: TBSpacing.x16) {
            TBCapsuleTabs(options: [1, 3, 6, 0], selection: $selectedPeriod) {
                $0 == 0 ? "전부" : "\($0)개월"
            }
            TBSelectionCard(title: "선택 반응 · 180ms", isSelected: selected) {
                selected.toggle()
            }
            CompactCardIconActionButton(
                symbol: .bookmark, isActive: selected, accessibilityLabel: "북마크 선택 확인"
            ) {
                selected.toggle()
            }
            PrimaryButton(title: "펼침 확인 · 300ms") {
                withAnimation(TasteBloomMotion.animation(.content, reduceMotion: reduceMotion)) {
                    expanded.toggle()
                }
            }
            if expanded {
                SectionCard {
                    Text("꽃잎처럼 피어나고, 끝에서 살짝 맺힙니다.")
                        .font(TBFont.regular(14))
                }
                .transition(TasteBloomMotion.reveal(reduceMotion: reduceMotion))
            }
            CardDetailLabel(label: expanded ? "접기" : "펼치기", direction: expanded ? .up : .down)
        }
        .padding(TBSpacing.page)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TBColor.page)
    }
}
