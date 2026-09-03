import SwiftUI

struct AnalysisView: View {
    @EnvironmentObject private var appModel: AppModel
    @State private var selectedInsight: NativeInsight?
    let systemTopChrome: AnyView?
    let onStartMeasurement: () -> Void
    let onOpenTasteChange: () -> Void

    init(
        systemTopChrome: AnyView? = nil,
        onStartMeasurement: @escaping () -> Void = {},
        onOpenTasteChange: @escaping () -> Void = {}
    ) {
        self.systemTopChrome = systemTopChrome
        self.onStartMeasurement = onStartMeasurement
        self.onOpenTasteChange = onOpenTasteChange
    }

    var body: some View {
        NavigationStack {
            MainTabChromeScrollView(topChrome: systemTopChrome) {
                if let profile = appModel.profile {
                    VStack(alignment: .leading, spacing: TBSpacing.section) {
                        TBPageSection(title: "나의 미각") {
                            PalateSignatureHeroCard(profile: profile)

                            InterpretationCard(
                                description: profile.chefTranslationSummary,
                                eyebrow: "셰프 참고 가이드",
                                detailLabel: "가이드 보기",
                                indicatorColors: profile.topAxes.map(\.mainColor),
                                indicatorWeights: profile.topAxes.map { axis in
                                    Double(
                                        abs(
                                            profile.score(for: axis)
                                                - TasteRadarContract.averageScore(for: axis)
                                        )
                                    )
                                },
                                onExpand: {
                                    selectedInsight = TasteBuddyNativeContent.insights[0]
                                }
                            )

                            ProfileConfidenceCard(
                                measurementAgeLabel: profile.measurementAgeLabel,
                                measurementCount: max(2, appModel.diningEntries.count + 1),
                                stage: .building,
                                strongestAxis: profile.strongestAxis,
                                weakestAxis: profile.weakestAxis
                            )

                            RadarComparisonCard(profile: profile)

                            TasteMeasurementMiniCta(
                                actionLabel: profile.isMeasurementStale ? "재측정" : "다시 측정",
                                actionFullWidth: !profile.isMeasurementStale,
                                description: profile.isMeasurementStale
                                    ? "\(profile.measurementDisplayAgeLabel) 데이터예요. 다시 측정하면 분석 결과를 더 현재 입맛에 맞게 볼 수 있어요."
                                    : "컨디션이 달라졌다면 지금 다시 측정해 이번 분석을 최신 상태로 맞출 수 있어요.",
                                meta: "마지막 측정 \(profile.formattedMeasurementDate)",
                                padding: profile.isMeasurementStale ? .default : .compact,
                                title: profile.isMeasurementStale
                                    ? "프로필 업데이트 추천"
                                    : "현재 컨디션 다시 측정",
                                tone: profile.isMeasurementStale ? .alert : .neutral,
                                accentAxis: profile.isMeasurementStale
                                    ? .sweet
                                    : profile.strongestAxis,
                                onAction: onStartMeasurement
                            )

                            TasteInsightSummaryCard(
                                data: .tasteProfile(
                                    profile,
                                    history: appModel.profileHistory
                                ),
                                onTap: onOpenTasteChange
                            )

                            TasteInsightSummaryCard(
                                data: .specialNote(
                                    profile,
                                    history: appModel.profileHistory
                                )
                            ) {
                                selectedInsight = NativeInsight(
                                    id: "special-note",
                                    eyebrow: "특이사항",
                                    title: TasteInsightSummaryCardData.specialNote(
                                        profile,
                                        history: appModel.profileHistory
                                    ).title,
                                    description: profile.specialNote,
                                    supportingText: profile.chefTranslationCopy,
                                    axis: profile.weakestAxis
                                )
                            }
                        }

                        TBPageSection(title: "세부 분석", titleSize: .medium) {
                            CardScrollList(spacing: TBSpacing.x12) {
                                ForEach(profile.analysisEntries) { entry in
                                    TasteTintMiniCard(entry: entry)
                                }
                            }
                        }

                        TBPageSection(title: "인사이트") {
                            VStack(spacing: 12) {
                                ForEach(TasteBuddyNativeContent.insights) { insight in
                                    InterpretationCard(
                                        description: insight.title,
                                        eyebrow: insight.eyebrow,
                                        supportingText: insight.description,
                                        detailLabel: "해석 보기",
                                        accentColor: insight.axis.mainColor,
                                        onExpand: {
                                            selectedInsight = insight
                                        }
                                    )
                                }
                            }
                        }
                    }
                    .tbPageContentPadding(bottom: TBSpacing.mainTabContentBottom)
                    .containerRelativeFrame(.horizontal, alignment: .leading)
                    .tbCardBordersVisible(false)
                }
            }
            .scrollBounceBehavior(.basedOnSize, axes: .horizontal)
            .navigationTitle("분석")
            .tbInlineNavigationTitle()
            .toolbar(.hidden, for: .navigationBar)
            .tbPageBackground()
            .sheet(item: $selectedInsight) { insight in
                InsightDetailSheet(insight: insight)
            }
        }
        .ignoresSafeArea(.container, edges: systemTopChrome == nil ? [] : .top)
    }
}

private struct InsightDetailSheet: View {
    let insight: NativeInsight
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton { dismiss() }),
            headerCenter: AnyView(Text("인사이트").tbTextStyle(.sheetTitle)),
            stageMode: .auto(maxHeightRatio: 1),
            usesNativeSheetChrome: true,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    SectionCard(background: insight.axis.tintColor.opacity(0.75)) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(spacing: 10) {
                                LucideIcon(
                                    systemName: insight.axis.symbol,
                                    size: TBIcon.Size.base,
                                    strokeWidth: TBIcon.Stroke.regular
                                )
                                    .frame(width: 38, height: 38)
                                    .foregroundStyle(insight.axis.mainColor)
                                    .background(TBColor.surface)
                                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(insight.eyebrow)
                                        .font(TBFont.semibold(11))
                                        .foregroundStyle(insight.axis.tintTextColor.opacity(0.72))
                                    Text(insight.title)
                                        .font(TBFont.bold(17))
                                        .foregroundStyle(insight.axis.tintTextColor)
                                }
                            }

                            Text(insight.description)
                                .font(TBFont.regular(13))
                                .foregroundStyle(insight.axis.tintTextColor.opacity(0.82))
                                .lineSpacing(4)
                        }
                    }

                    TBPageSection(
                        title: "What it means",
                        subtitle: "숫자를 결론처럼 보여주기보다, 다음 다이닝에서 어떻게 쓰일지를 먼저 해석합니다."
                    ) {
                        SectionCard {
                            Text(insight.supportingText)
                                .font(TBFont.regular(13))
                                .foregroundStyle(TBColor.textBody)
                                .lineSpacing(4)
                        }
                    }

                    TBPageSection(
                        title: "What happens next",
                        subtitle: "이 인사이트는 셰프에게 명령하는 문장이 아니라, 손님이 코스를 더 편안하게 받아들이도록 돕는 context입니다."
                    ) {
                        VStack(spacing: 10) {
                            StatusRow(
                                icon: "fork.knife",
                                title: "다음 식사",
                                detail: "조절점 반영",
                                tone: .neutral
                            )
                            StatusRow(
                                icon: "arrow.triangle.2.circlepath",
                                title: "프로필 정교화",
                                detail: "피드백 후 갱신",
                                tone: .warning
                            )
                        }
                    }
                }
                .tbPageContentPadding()
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .presentationCornerRadius(BottomSheetShellMetrics.topRadius)
    }
}

#Preview("Insight detail — shared native sheet") {
    InsightDetailSheet(insight: TasteBuddyNativeContent.insights[0])
}

private struct RadarComparisonCard: View {
    private let measurements: [RadarMeasurementSnapshot]
    @State private var selectedIndex: Int

    init(profile: TasteProfile) {
        measurements = [RadarMeasurementSnapshot(profile: profile)]
        _selectedIndex = State(initialValue: 0)
    }

    var body: some View {
        SectionCard {
            VStack(spacing: 0) {
                HStack {
                    navigationButton(
                        symbol: "chevron.left",
                        accessibilityLabel: "이전 측정 그래프 보기",
                        isEnabled: canShowPrevious
                    ) {
                        selectedIndex = max(0, selectedIndex - 1)
                    }

                    Spacer()
                    Text(selectedMeasurement.periodLabel)
                        .font(TBFont.semibold(14))
                        .foregroundStyle(TBColor.textPrimary)

                    Spacer()
                    navigationButton(
                        symbol: "chevron.right",
                        accessibilityLabel: "다음 측정 그래프 보기",
                        isEnabled: canShowNext
                    ) {
                        selectedIndex = min(measurements.count - 1, selectedIndex + 1)
                    }
                }

                TasteRadarView(entries: selectedMeasurement.entries)
                    .frame(maxWidth: 360)
                    .frame(maxWidth: .infinity, alignment: .center)

                HStack(alignment: .bottom, spacing: 4) {
                    VStack(spacing: 4) {
                        Text("나의 반응")
                            .font(TBFont.regular(10))
                            .foregroundStyle(TBColor.textHint)
                        RadarComparisonValueBadge(selectedMeasurement.totalSensitivityLabel)
                    }

                    RadarComparisonArrowBadge()

                    VStack(spacing: 4) {
                        Text("기준 반응")
                            .font(TBFont.regular(10))
                            .foregroundStyle(TBColor.textHint)
                        RadarComparisonValueBadge("평균")
                    }
                }
                .padding(.top, 8)
            }
        }
    }

    private var selectedMeasurement: RadarMeasurementSnapshot {
        measurements[min(max(selectedIndex, 0), measurements.count - 1)]
    }

    private var canShowPrevious: Bool {
        selectedIndex > 0
    }

    private var canShowNext: Bool {
        selectedIndex < measurements.count - 1
    }

    private func navigationButton(
        symbol: String,
        accessibilityLabel: String,
        isEnabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            LucideIcon(
                systemName: symbol,
                size: TBIcon.Size.base,
                strokeWidth: TBIcon.Stroke.regular
            )
                .foregroundStyle(isEnabled ? TBColor.textPrimary : TBColor.textDisabled)
                .frame(width: 32, height: 32)
                .contentShape(Circle())
        }
        .buttonStyle(TBTokenButtonStyle())
        .disabled(!isEnabled)
        .accessibilityLabel(accessibilityLabel)
    }
}

private struct RadarComparisonValueBadge: View {
    let label: String

    init(_ label: String) {
        self.label = label
    }

    var body: some View {
        Text(label)
            .font(TBFont.bold(12))
            .foregroundStyle(Color.white)
            .lineLimit(1)
            .fixedSize(horizontal: true, vertical: true)
            .padding(.horizontal, 10)
            .padding(.vertical, 3)
            .frame(height: 24)
            .background(TBColor.textPrimary)
            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}

private struct RadarComparisonArrowBadge: View {
    var body: some View {
        Text("→")
            .font(TBFont.bold(10))
            .foregroundStyle(Color.white)
            .frame(width: 24, height: 24)
            .fixedSize()
            .background(TBColor.textDisabled)
            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}
