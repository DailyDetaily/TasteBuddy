import SwiftUI
import UIKit

struct OnboardingView: View {
    let onComplete: () -> Void
    @State private var selection = 0

    private let steps = [
        OnboardingStep(
            imageName: "onboarding_render_1",
            title: "더 잘 맞는 식사를\n시작해보세요",
            description: "Taste Buddy는 당신의 현재 입맛을 이해해,\n다양한 식당에서 더 잘 맞는 식사로 이어줍니다."
        ),
        OnboardingStep(
            imageName: "onboarding_render_2",
            title: "가볍게 시작해\n현재 프로필을 만듭니다",
            description: "복잡한 설명보다, 지금의 미각 경향을 빠르게 정리해\n첫 예약부터 활용할 수 있는 프로필을 만듭니다."
        ),
        OnboardingStep(
            imageName: "onboarding_render_3",
            title: "프로필은 식당과 식사 맥락에 맞춰\n실용적으로 전달됩니다",
            description: "당신의 프로필은 매장과 주방이 의도를 해치지 않으면서도\n더 잘 맞는 경험을 준비할 수 있도록 정리됩니다."
        ),
        OnboardingStep(
            imageName: "onboarding_render_4",
            title: "프로필은 식사와 피드백을 통해\n조금씩 더 정교해집니다",
            description: "예약, 식후 피드백, 다시 찾은 선택이 쌓일수록\n다음 다이닝은 더 자연스럽고 섬세하게 맞춰집니다."
        ),
    ]

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                Color.clear
                    .frame(height: TBSize.topAppBarHeight)

                TabView(selection: $selection) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                        OnboardingPage(step: step)
                            .tag(index)
                    }
                }
                .tbPagingTabStyle()
            }

            TBFlowStepCTA(
                actionLabel: selection == steps.count - 1 ? "시작하기" : "다음",
                currentIndex: selection,
                total: steps.count,
                action: advance
            )
        }
        .background(TBColor.focus.ignoresSafeArea())
    }

    private func advance() {
        if selection == steps.count - 1 {
            onComplete()
        } else {
            withAnimation(.easeInOut(duration: 0.28)) {
                selection += 1
            }
        }
    }
}

private struct OnboardingStep {
    let imageName: String
    let title: String
    let description: String
}

private struct OnboardingPage: View {
    let step: OnboardingStep

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                Spacer(minLength: 0)

                Group {
                    if let image = bundledImage {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 280)
                .accessibilityHidden(true)
                .padding(.bottom, 32)

                VStack(spacing: 8) {
                    Text(step.title)
                        .font(TBFont.bold(18))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(TBColor.textPrimary)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)

                    Text(step.description)
                        .font(TBFont.regular(14))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(TBColor.textTertiary)
                        .lineSpacing(5)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(minHeight: 100, alignment: .top)
                .padding(.horizontal, 20)

                Spacer(minLength: 0)
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, 16)
            .padding(.bottom, 156)
            .offset(y: -geometry.size.height * 0.04)
        }
    }

    private var bundledImage: UIImage? {
        guard let path = Bundle.main.path(
            forResource: step.imageName,
            ofType: "png"
        ) else {
            return nil
        }
        return UIImage(contentsOfFile: path)
    }
}

#if canImport(PreviewsMacros)
    #Preview {
        OnboardingView(onComplete: {})
    }
#endif
