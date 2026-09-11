import SwiftUI

struct DiningOverallEvaluationStepView: View {
    @Binding var evaluation: DiningOverallEvaluation?
    let onBack: () -> Void
    let onContinue: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                TBFlowTopBar(
                    title: "전체 평가",
                    leadingAccessibilityLabel: "메뉴 선택으로 돌아가기",
                    backgroundColor: TBColor.page,
                    leadingAction: onBack
                )

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(DiningOverallEvaluation.question)
                                .font(TBFont.bold(20))
                                .foregroundStyle(TBColor.textPrimary)
                            Text("가장 가까운 느낌을 골라주세요.")
                                .font(TBFont.regular(13))
                                .foregroundStyle(TBColor.textSubtle)
                                .lineSpacing(4)
                        }

                        VStack(spacing: 10) {
                            ForEach(DiningOverallEvaluation.Response.allCases) { response in
                                TBSelectionCard(
                                    title: response.label,
                                    indicator: .radio,
                                    isSelected: DiningSensoryRecommendationPolicy.isSupported(evaluation)
                                        && evaluation?.responseValue == response,
                                    showsUnselectedBorder: false
                                ) {
                                    evaluation = DiningOverallEvaluation(response: response)
                                }
                            }
                        }
                    }
                    .tbPageContentPadding(bottom: TBSpacing.page + 148)
                }
                .scrollIndicators(.hidden)
                .scrollBounceBehavior(.basedOnSize)
            }

            TBFlowStepCTA(
                actionLabel: "미각 버블 고르기",
                currentIndex: 1,
                total: 2,
                isEnabled: DiningSensoryRecommendationPolicy.isSupported(evaluation),
                actionVisualDisabled: !DiningSensoryRecommendationPolicy.isSupported(evaluation),
                helperText: DiningSensoryRecommendationPolicy.isSupported(evaluation)
                    ? nil
                    : "전체 평가를 하나 선택해 주세요.",
                backgroundColor: TBColor.page,
                showsIndicator: false,
                action: onContinue
            )
        }
        .background(TBColor.page.ignoresSafeArea())
    }

}

private struct DiningOverallEvaluationStepPreview: View {
    @State private var evaluation: DiningOverallEvaluation? = .init(response: .liked)

    var body: some View {
        DiningOverallEvaluationStepView(
            evaluation: $evaluation,
            onBack: {},
            onContinue: {}
        )
    }
}

#Preview("Dining overall evaluation") {
    DiningOverallEvaluationStepPreview()
}
