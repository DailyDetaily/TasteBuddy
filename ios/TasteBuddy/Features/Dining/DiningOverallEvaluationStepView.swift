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
                    showsDivider: false,
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
                            if let evaluation, evaluation.questionVersion == DiningOverallEvaluation.starVersion,
                               let rating = evaluation.starRating {
                                Text("현재 평가: \(DiningOverallEvaluation.starText(rating))점")
                                    .font(TBFont.medium(13))
                                    .foregroundStyle(TBColor.textSubtle)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            ForEach(DiningOverallEvaluation.Response.allCases) { response in
                                TBSelectionCard(
                                    title: response.label,
                                    indicator: .radio,
                                    isSelected: DiningSensoryRecommendationPolicy.isSupported(evaluation)
                                        && evaluation?.responseValue == response,
                                    singleLine: true,
                                    showsUnselectedBorder: false
                                ) {
                                    evaluation = DiningOverallEvaluation(response: response)
                                }
                            }
                        }
                    }
                    .padding(.top, 16)
                    .tbPageContentPadding(bottom: TBSpacing.page + 148)
                }
                .scrollIndicators(.hidden)
                .scrollBounceBehavior(.basedOnSize)
            }

            VStack(spacing: 0) {
                Spacer(minLength: 0)
                if !DiningSensoryRecommendationPolicy.isSupported(evaluation) {
                    Text("전체 평가를 하나 선택해 주세요.")
                        .font(TBFont.medium(11))
                        .foregroundStyle(TBColor.textFaint)
                        .multilineTextAlignment(.center)
                        .padding(.bottom, FlowBottomCtaMetrics.helperBottomMargin)
                }

                PrimaryButton(
                    title: "미각 버블 고르기",
                    isEnabled: DiningSensoryRecommendationPolicy.isSupported(evaluation),
                    visualDisabled: !DiningSensoryRecommendationPolicy.isSupported(evaluation),
                    action: onContinue
                )
            }
            .padding(.horizontal, FlowBottomCtaMetrics.horizontalPadding)
            .padding(.bottom, FlowBottomCtaMetrics.bottomPadding)
            .frame(maxWidth: .infinity)
            .frame(height: FlowBottomCtaMetrics.minHeight)
            .background(
                LinearGradient(
                    stops: [
                        .init(color: TBColor.page.opacity(0), location: 0),
                        .init(color: TBColor.page.opacity(0.8), location: 0.45),
                        .init(color: TBColor.page, location: 1),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea(edges: .bottom)
                .allowsHitTesting(false)
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
