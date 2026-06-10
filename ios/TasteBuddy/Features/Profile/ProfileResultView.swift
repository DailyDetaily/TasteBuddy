import SwiftUI

struct ProfileResultView: View {
    let profile: TasteProfile

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                VStack(alignment: .leading, spacing: 10) {
                    OutlineBadge(title: "\(profile.confidence) Profile")
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text("첫 미각 프로필이 준비됐어요")
                            .font(TBFont.bold(18))
                        LucideIcon(
                            .circleCheck,
                            size: TBIcon.Size.medium,
                            strokeWidth: TBIcon.Stroke.regular,
                            filled: true
                        )
                            .foregroundStyle(TBColor.textPrimary)
                    }
                    Text(profile.summary)
                        .font(TBFont.regular(13))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(4)
                }

                SectionCard(background: TBColor.mutedSurface) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Confidence")
                            .font(TBFont.semibold(11))
                            .foregroundStyle(TBColor.textHint)
                        Text("시작 기준으로는 충분하고, 세부 축은 계속 다듬어집니다")
                            .font(TBFont.bold(15))
                        Text("지금의 결과는 다음 식사를 더 잘 맞추기 위한 시작점입니다. 식후 피드백이 쌓이면 각 축의 해석이 더 정교해집니다.")
                            .font(TBFont.regular(13))
                            .foregroundStyle(TBColor.textBody)
                            .lineSpacing(3)
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("먼저 읽히는 포인트")
                        .font(TBFont.bold(16))

                    HStack(spacing: 10) {
                        ForEach(profile.topAxes.prefix(2)) { axis in
                            TasteTintMiniCard(
                                entry: TasteAxisAnalysis(
                                    axis: axis,
                                    score: profile.score(for: axis),
                                    delta: profile.score(for: axis) - 50
                                )
                            )
                        }
                    }
                }

                VStack(spacing: 10) {
                    ForEach(resultAxes) { axis in
                        AxisInterpretationCard(
                            axis: axis,
                            score: profile.score(for: axis),
                            label: axis == profile.cautionAxis
                                ? "부담 신호 확인"
                                : "먼저 읽히는 축"
                        )
                    }
                }

                SectionCard(background: TBColor.mutedSurface) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("이 프로필은 계속 진화합니다")
                            .font(TBFont.bold(14))
                        Text("식사 후 짧은 피드백을 남기면 실제 경험과 시작 프로필의 차이를 확인해 다음 해석을 더 정교하게 만들어요.")
                            .font(TBFont.regular(13))
                            .foregroundStyle(TBColor.textBody)
                            .lineSpacing(4)
                    }
                }
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, 16)
            .padding(.bottom, 40)
        }
        .background(TBColor.focus)
        .scrollIndicators(.hidden)
    }

    private var resultAxes: [TasteAxis] {
        ([profile.cautionAxis] + profile.topAxes + [.umami, .fat]).reduce(into: []) {
            if !$0.contains($1) {
                $0.append($1)
            }
        }
    }
}

struct AxisInterpretationCard: View {
    let axis: TasteAxis
    let score: Int
    let label: String

    var body: some View {
        SectionCard(background: axis.tintColor.opacity(0.65)) {
            HStack(alignment: .top, spacing: 12) {
                LucideIcon(
                    systemName: axis.symbol,
                    size: TBIcon.Size.base,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .foregroundStyle(axis.mainColor)
                    .frame(width: 40, height: 40)
                    .background(Color.white.opacity(0.8))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(axis.label)
                            .font(TBFont.bold(14))
                        Spacer()
                        Text(label)
                            .font(TBFont.medium(10))
                            .foregroundStyle(axis.tintTextColor.opacity(0.8))
                    }
                    Text(CalibrationEngine.interpretation(for: axis, score: score))
                        .font(TBFont.regular(12))
                        .foregroundStyle(axis.tintTextColor)
                        .lineSpacing(3)
                }
            }
        }
    }
}

#if canImport(PreviewsMacros)
    #Preview {
        ProfileResultView(profile: .sample)
    }
#endif
