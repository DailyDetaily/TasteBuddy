import SwiftUI

/// 온보딩과 분석은 저장된 같은 회상 응답을 보여준다. 식사 관찰 수나 민감도 점수를 만들지 않는다.
struct TasteSurveyEvidenceCard: View {
    let submission: TasteSurveySubmissionContract

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    OutlineBadge(title: "기준 음식 회상")
                    Text(submission.summary)
                        .font(TBFont.regular(13))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(4)
                }

                ForEach(Array(submission.items.enumerated()), id: \.element.id) { index, item in
                    if index > 0 { Divider() }
                    HStack(alignment: .top, spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.tasteId.label)
                                .font(TBFont.semibold(13))
                                .foregroundStyle(item.tasteId.tintSurfaceTextColor)
                            Text(item.anchor.label)
                                .font(TBFont.regular(12))
                                .foregroundStyle(TBColor.textHint)
                        }
                        Spacer(minLength: 4)
                        Text(submission.responseLabel(for: item.id))
                            .font(TBFont.medium(12))
                            .foregroundStyle(TBColor.textPrimary)
                            .multilineTextAlignment(.trailing)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: 144, alignment: .trailing)
                    }
                    .accessibilityElement(children: .combine)
                }

                Text("우유의 지방맛은 예비 단서예요. 부드러움·고소한 향·느끼함과 구분해 살펴봐요.")
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textHint)
                    .lineSpacing(4)

                DisclosureGroup("기준 음식과 조건 보기") {
                    VStack(alignment: .leading, spacing: 14) {
                        ForEach(submission.items) { item in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.anchor.label).font(TBFont.semibold(12))
                                Text(item.anchor.description).font(TBFont.regular(12))
                            }
                        }
                    }
                    .foregroundStyle(TBColor.textBody)
                    .padding(.top, 10)
                }
                .font(TBFont.medium(12))
                .tint(TBColor.textSecondary)
            }
        }
    }
}

#if canImport(PreviewsMacros)
#Preview("기준 음식 회상 · 응답과 모름") {
    if let catalog = try? TasteSurveyCatalogLoader.load(),
       let submission = TasteSurveyScoringEngine.makeCompatibleResult(
        items: catalog.items,
        responses: catalog.items.map { item in
            .init(itemId: item.id, selectedValue: item.tasteId == .fat ? nil : 2,
                  uncertain: item.tasteId == .fat,
                  uncertaintyReason: item.tasteId == .fat ? .cannotIsolateTaste : nil)
        },
        measuredAt: "2026-09-07T00:00:00Z"
       ).snapshot.surveySubmission {
        ScrollView { TasteSurveyEvidenceCard(submission: submission).padding(TBSpacing.page) }
            .background(TBColor.page)
    }
}
#endif
