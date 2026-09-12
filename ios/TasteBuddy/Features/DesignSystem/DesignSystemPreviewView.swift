import SwiftUI

struct DesignSystemPreviewView: View {
    private let profile = TasteProfile.sample

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                previewHeader
                FoundationPreviewSection()
                TastePalettePreviewSection()
                CoreControlsPreviewSection()
                SystemCoreComponentsPreviewSection()
                NativeRegistryPreviewSection()
                NativeInputRecipesPreviewSection()
                StateRecipesPreviewSection()
                FullInventoryPreviewSection(profile: profile)
                GenericPrimitivePreviewSection()
                FileOnlyPreviewSection()
                ProductCardsPreviewSection(profile: profile)
            }
            .padding(TBSpacing.page)
        }
        .background(TBColor.page.ignoresSafeArea())
    }

    private var previewHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            OutlineBadge(title: "Native preview")
            Text("Taste Buddy Design System")
                .font(TBFont.bold(18))
                .foregroundStyle(TBColor.textPrimary)
            Text("Quiet Hospitality Intelligence를 SwiftUI 토큰과 공용 컴포넌트로 고정합니다. 숫자보다 해석, 장식보다 다음 다이닝 행동을 먼저 보여주는 기준 화면입니다.")
                .font(TBFont.regular(13))
                .foregroundStyle(TBColor.textBody)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Isolated state fixture for simulator checks; it does not mutate product data.
struct NativeDesignStatesPreview: View {
    @State private var enlargedText = false
    @State private var correction = "주소"

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TBSpacing.section) {
                Toggle("글자 확대 확인", isOn: $enlargedText)
                    .font(TBFont.semibold(14))
                    .tint(TBColor.textPrimary)
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    SectionCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("식당 정보 수정 · 선택 레이아웃").tbTextStyle(.caption)
                            TBFlowLayout(spacing: 8) {
                                ForEach(["주소", "전화번호", "영업시간", "인스타그램"], id: \.self) { title in
                                    TBSelectableChip(
                                        title: title,
                                        isSelected: correction == title,
                                        variant: .correction
                                    ) { correction = title }
                                }
                            }
                        }
                    }
                    NativeInputRecipesPreviewSection()
                    StateRecipesPreviewSection()
                }
                .dynamicTypeSize(enlargedText ? .accessibility2 : .large)
            }
            .padding(TBSpacing.page)
        }
        .background(TBColor.page.ignoresSafeArea())
    }
}

private struct FoundationPreviewSection: View {
    var body: some View {
        TBPageSection(
            title: "Foundation",
            subtitle: "제품 기준을 보존한 네이티브 토큰과 글자 역할입니다. 현재 SwiftUI 수치는 ios/DESIGN_SYSTEM.md에서 확인합니다."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(TokenSwatchModel.foundation) { swatch in
                            TokenSwatch(swatch: swatch)
                        }
                    }
                    .padding(.vertical, 2)
                }

                SectionCard(background: TBColor.elevatedSurface) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Pretendard · 글자 역할")
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)

                        VStack(alignment: .leading, spacing: 6) {
                            Text("다음 다이닝을 위한 해석")
                                .tbTextStyle(.sectionTitle)
                            Text("본문은 차분하게 읽히도록 크기와 행간을 함께 사용합니다.")
                                .tbTextStyle(.body)
                            Text("캡션은 짧은 보조 정보를 전달합니다.")
                                .tbTextStyle(.caption)
                            Text("자세히 보기")
                                .tbTextStyle(.detailAction)
                        }
                    }
                }

                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 104), spacing: 8)],
                    alignment: .leading,
                    spacing: 8
                ) {
                    TokenPill(label: "page", value: "20")
                    TokenPill(label: "section", value: "20")
                    TokenPill(label: "card", value: "12")
                    TokenPill(label: "button", value: "48h")
                    TokenPill(label: "badge r", value: "6")
                    TokenPill(label: "card r", value: "20")
                }
            }
        }
    }
}

private struct TastePalettePreviewSection: View {
    var body: some View {
        TBPageSection(
            title: "Taste Palette",
            subtitle: "Taste color는 장식이 아니라 맛 맥락을 해석하는 곳에서만 사용합니다."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 132), spacing: 10)],
                    alignment: .leading,
                    spacing: 10
                ) {
                    ForEach(TasteAxis.allCases) { axis in
                        TastePaletteCard(axis: axis)
                    }
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(TasteProfile.sample.analysisEntries) { entry in
                            TasteTintMiniCard(entry: entry)
                        }
                    }
                    .padding(.vertical, 2)
                }

                SectionCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Taste Gradient Indicator")
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)

                        HStack(spacing: TBSpacing.x16) {
                            TasteGradientIndicator(
                                segments: previewIndicatorSegments
                            )

                            TasteGradientIndicator(
                                segments: previewIndicatorSegments,
                                style: .verticalCapsule
                            )
                            .frame(height: 40)

                            Text("같은 가중치와 혼합 규칙을 원형·세로 캡슐에 적용합니다.")
                                .font(TBFont.regular(11))
                                .foregroundStyle(TBColor.textHint)
                                .lineSpacing(2)
                        }
                    }
                }

                SectionCard {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Palate Bloom Avatar")
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)

                        HStack(spacing: 24) {
                            PalateBloomPreviewItem(
                                title: "Profile A",
                                profile: .sampleA
                            )
                            PalateBloomPreviewItem(
                                title: "Profile B",
                                profile: .sampleB
                            )
                            PalateBloomPreviewItem(
                                title: "Profile C",
                                profile: .sampleC
                            )
                        }
                        .frame(maxWidth: .infinity)

                        Text("React PalateBloomAvatar와 같은 프로필 정렬, seed, shape variant 규칙을 사용합니다.")
                            .font(TBFont.regular(11))
                            .foregroundStyle(TBColor.textHint)
                            .lineSpacing(2)
                    }
                }
            }
        }
    }

    private var previewIndicatorSegments: [TasteGradientIndicatorSegment] {
        [
            TasteGradientIndicatorSegment(color: TasteAxis.sour.mainColor, weight: 3),
            TasteGradientIndicatorSegment(color: TasteAxis.umami.mainColor, weight: 1),
        ]
    }
}

private struct PalateBloomPreviewItem: View {
    let title: String
    let profile: PalateBloomProfile

    var body: some View {
        VStack(spacing: 8) {
            PalateBloomAvatar(size: 58, bloomProfile: profile)
            Text(title)
                .font(TBFont.medium(10))
                .foregroundStyle(TBColor.textBody)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct CoreControlsPreviewSection: View {
    var body: some View {
        TBPageSection(
            title: "Core Controls",
            subtitle: "작은 선택지는 칩으로, 주요 전진 행동은 48pt CTA로 유지합니다."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                SectionCard {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack(spacing: 8) {
                            OutlineBadge(title: "Profile based")
                            NeutralChip(title: "식사 기록 2회", symbol: "fork.knife")
                            TasteChip(axis: .umami, value: "72")
                        }

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                Chip(
                                    title: "Neutral",
                                    size: .extraSmall,
                                    tone: .neutral
                                )
                                Chip(
                                    title: "Success",
                                    leadingSymbol: "checkmark",
                                    tone: .success
                                )
                                Chip(
                                    title: "Warning",
                                    tone: .warning,
                                    variant: .outline
                                )
                                Chip(
                                    title: "Accent",
                                    trailingSymbol: "chevron.right",
                                    size: .medium,
                                    tone: .accent,
                                    variant: .solid
                                )
                            }
                        }

                        VStack(spacing: 10) {
                            PrimaryButton(title: "다음 다이닝을 더 잘 맞추기") {}
                            PrimaryButton(title: "프로필 동기화 대기 중", isEnabled: false) {}
                        }
                    }
                }

                SectionCard {
                    VStack(spacing: 16) {
                        StatusRow(
                            icon: "sparkles",
                            title: "미각 프로필",
                            detail: "Starter",
                            tone: .success
                        )
                        Divider()
                        StatusRow(
                            icon: "arrow.triangle.2.circlepath",
                            title: "다음 정교화",
                            detail: "피드백 1회 남음",
                            tone: .warning
                        )
                        Divider()
                        StatusRow(
                            icon: "icloud",
                            title: "staging sync",
                            detail: "fixture",
                            tone: .neutral
                        )
                    }
                }
            }
        }
    }
}

private struct SystemCoreComponentsPreviewSection: View {
    var body: some View {
        TBPageSection(
            title: "System Core Components",
            subtitle: "React system 컴포넌트를 SwiftUI 공용 부품으로 고정한 배치입니다."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                SectionCard {
                    VStack(alignment: .leading, spacing: 14) {
                        VStack(alignment: .leading, spacing: 6) {
                            SectionTitle(title: "SectionTitle large")
                            SectionTitle(title: "SectionTitle medium", size: .medium)
                        }

                        HStack(spacing: 10) {
                            ImageBox(
                                alt: "온지음",
                                kind: .restaurant,
                                fallback: .restaurant,
                                size: .small
                            )
                            ImageBox(
                                alt: "맑은 육수 코스",
                                kind: .menu,
                                size: .medium
                            )
                            ChefAvatar(
                                alt: "온지음 셰프",
                                size: .large,
                                taste: .umami
                            )
                            StatusChip(title: "동기화 대기")
                            StatusChip(
                                title: "기록 완료",
                                backgroundColor: TBColor.successSoft,
                                foregroundColor: TBColor.success
                            )
                        }
                    }
                }

                SectionCard {
                    EmptyState(
                        title: "아직 표시할 다이닝 기록이 없어요",
                        description: "첫 피드백을 남기면 다음 다이닝의 조절점이 더 구체적으로 정리됩니다.",
                        actionLabel: "피드백 남기기",
                        icon: .utensils,
                        onAction: {}
                    )
                }

                BottomSheetShell(
                    headerCenter: AnyView(
                        Text("저장 리스트")
                            .font(TBFont.bold(15))
                            .foregroundStyle(TBColor.textPrimary)
                    ),
                    headerEnd: AnyView(BottomSheetCloseButton(action: {})),
                    footer: AnyView(PrimaryButton(title: "선택 완료") {})
                ) {
                    VStack(alignment: .leading, spacing: 10) {
                        StatusChip(title: "private")
                        Text("BottomSheetShell의 그랩버 오버레이, 32pt header slot, 20pt top / 12pt bottom inset을 SwiftUI sheet content로 재사용합니다.")
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textBody)
                            .lineSpacing(3)
                    }
                    .padding(.horizontal, TBSpacing.page)
                    .padding(.top, 4)
                }
                .frame(height: 260)

                ActionOverlayCard(
                    title: "이 기록을 정리할까요?",
                    description: "삭제 전 확인처럼 짧은 결정을 요구하는 오버레이에 사용합니다.",
                    actions: [
                        ActionOverlayCardAction(id: "cancel", label: "취소"),
                        ActionOverlayCardAction(id: "delete", label: "삭제", tone: .destructive)
                    ]
                )
                .frame(height: 220)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
            }
        }
    }
}

private struct NativeRegistryPreviewSection: View {
    var body: some View {
        TBPageSection(
            title: "네이티브 컴포넌트 등록부",
            subtitle: "Swift 타입과 파일, 실제 제품 사용 여부를 구분합니다. 제품용 부품부터 선택하고 시각 참고 견본을 그대로 화면에 넣지 않습니다."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(NativeComponentUsage.allCases, id: \.self) { usage in
                    let entries = NativeProductComponentCatalog.entries.filter { $0.usage == usage }
                    SectionCard {
                        DisclosureGroup("\(usage.rawValue) · \(entries.count)") {
                            VStack(alignment: .leading, spacing: 16) {
                                ForEach(entries) { entry in
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(entry.swiftType)
                                            .font(TBFont.semibold(13))
                                            .foregroundStyle(TBColor.textPrimary)
                                        Text("TasteBuddy/\(entry.sourceFile)")
                                            .font(TBFont.regular(11))
                                            .foregroundStyle(TBColor.textBody)
                                            .textSelection(.enabled)
                                        Text(entry.note)
                                            .font(TBFont.regular(12))
                                            .foregroundStyle(TBColor.textBody)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                            .padding(.top, 12)
                        }
                        .font(TBFont.semibold(13))
                        .tint(TBColor.textPrimary)
                    }
                }
            }
        }
    }
}

private struct NativeInputRecipesPreviewSection: View {
    @State private var restaurant = ""
    @State private var email = "taste@"
    @State private var selected = true

    var body: some View {
        TBPageSection(
            title: "네이티브 입력과 선택",
            subtitle: "실제 입력·포커스·오류·비활성·선택 상태를 확인하는 제품 컴포넌트입니다."
        ) {
            VStack(spacing: 12) {
                SectionCard {
                    VStack(alignment: .leading, spacing: 16) {
                        TBTextInput(
                            text: $restaurant,
                            placeholder: "예: 정식당",
                            label: "식당명",
                            helperText: "직접 입력하고 키보드와 포커스 표시를 확인해 보세요."
                        )
                        TBTextInput(
                            text: $email,
                            placeholder: "이메일을 입력해주세요",
                            label: "이메일 · 오류 예시",
                            errorText: "이메일 주소를 확인해주세요.",
                            variant: .auth,
                            keyboardType: .emailAddress,
                            textContentType: .emailAddress
                        )
                        TBTextInput(
                            text: .constant("taste@example.com"),
                            placeholder: "이메일을 입력해주세요",
                            label: "이메일 · 전송 중",
                            variant: .auth,
                            isEnabled: false
                        )
                        TBWrapLayout(spacing: 8) {
                            TBSelectableChip(title: "디저트", isSelected: selected) { selected.toggle() }
                            TBSelectableChip(title: "주소", variant: .correction) {}
                            TBSelectableChip(title: "선택 불가", isEnabled: false) {}
                        }
                    }
                }
                SectionCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("미각 라벨과 넘치는 태그").tbTextStyle(.caption)
                        TBWrapLayout(spacing: 6) {
                            ForEach(TasteAxis.allCases) { axis in
                                TasteChip(title: axis.label, tone: .taste, colorAxis: axis, size: .sm)
                            }
                        }
                        TBOverflowTagRow(items: TasteAxis.allCases) { axis in
                            TasteChip(title: axis.label, tone: .neutral, size: .sm)
                        } overflow: { count in
                            TasteChip(title: "+\(count)", tone: .neutral, size: .sm)
                                .accessibilityLabel("\(count)개 태그 더 있음")
                        }
                        .frame(maxWidth: 220)
                        PrimaryButton(
                            title: "미각 측정 이어가기",
                            size: .compact,
                            appearance: .tasteTint(.sweet),
                            action: {}
                        )
                    }
                }
            }
        }
    }
}

private struct FullInventoryPreviewSection: View {
    let profile: TasteProfile

    var body: some View {
        TBPageSection(
            title: "웹 기준 이식 인벤토리",
            subtitle: "기존 React 카탈로그의 이식 이력입니다. 아래 수치는 현재 제품 사용 여부나 상태 검증 완료를 뜻하지 않습니다."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 144), spacing: 8)],
                    alignment: .leading,
                    spacing: 8
                ) {
                    InventoryMetricPill(
                        label: "architecture",
                        value: "\(NativeDesignSystemInventory.totalArchitectureComponentCount)"
                    )
                    InventoryMetricPill(
                        label: "file previews",
                        value: "\(NativeDesignSystemInventory.filePreviewEntries.count)"
                    )
                    InventoryMetricPill(
                        label: "style specs",
                        value: "\(NativeDesignSystemInventory.componentStyleSpecCount)"
                    )
                    InventoryMetricPill(
                        label: "ui primitives",
                        value: "\(NativeDesignSystemInventory.unusedPrimitiveCount)"
                    )
                }

                ForEach(NativeDesignSystemInventory.architectureGroups, id: \.title) { group in
                    SectionCard(background: TBColor.elevatedSurface) {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(group.title)
                                    .font(TBFont.semibold(13))
                                    .foregroundStyle(TBColor.textPrimary)
                                Spacer()
                                StatusChip(title: "\(group.components.count)")
                            }

                            TBFlowLayout(spacing: 6) {
                                ForEach(group.components, id: \.self) { component in
                                    Chip(
                                        title: component,
                                        size: .extraSmall,
                                        tone: .neutral,
                                        variant: .soft
                                    )
                                }
                            }
                        }
                    }
                }

                SectionCard {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Avatar / Status File-Only Set")
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)

                        HStack(spacing: 14) {
                            TasteProfileAvatar(
                                scores: Dictionary(
                                    uniqueKeysWithValues: TasteAxis.allCases.map { ($0, profile.score(for: $0)) }
                                ),
                                size: 48
                            )
                            PalateSignatureAvatar(profile: profile, size: 58)
                            PalateOrbAvatar(axes: profile.topAxes + TasteAxis.allCases, size: 54)
                            TCSBadge(title: "TCS")
                        }
                    }
                }
            }
        }
    }
}

private struct GenericPrimitivePreviewSection: View {
    var body: some View {
        TBPageSection(
            title: "시각 참고 · Generic UI Primitives",
            subtitle: "정적 웹 primitive 견본입니다. 입력과 액션의 실제 상태는 위의 네이티브 제품 컴포넌트에서 확인합니다."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                TBUICard(title: "ui/card.tsx", description: "generic card primitive") {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(spacing: 8) {
                            TBUIBadge(title: "Badge")
                            TBUIBadge(title: "Outline", variant: .outline)
                        }
                        TBUIButton(title: "Button default")
                        TBUIButton(title: "Button outline", variant: .outline)
                    }
                }

                SectionCard {
                    VStack(alignment: .leading, spacing: 10) {
                        TBUIInput(placeholder: "Input", text: "레스토랑 이름")
                        TBUITextarea(placeholder: "Textarea", text: "식사 후 남은 감각을 짧게 적습니다.")
                        TBUISelectTrigger(title: "Select trigger")
                        TBUICheckbox(title: "Checkbox", isChecked: true)
                        TBUIRadioGroup(options: ["부드럽게", "균형 있게", "선명하게"], selectedIndex: 1)
                        HStack {
                            Text("Switch")
                                .font(TBFont.medium(13))
                            Spacer()
                            TBUISwitch(isOn: true)
                        }
                        TBUITabs(tabs: ["기본", "상태", "오버레이"], selectedIndex: 0)
                    }
                }

                SectionCard {
                    VStack(alignment: .leading, spacing: 12) {
                        TBUIAlert(title: "Alert", description: "동기화가 잠시 지연되어도 로컬 변경은 유지됩니다.")
                        TBUIProgress(value: 0.62)
                        TBUISkeleton(height: 42)
                        TBUISliderPreview(value: 0.58, axis: .sour)
                        ToastSurface(
                            title: "Toast surface",
                            message: "디자인 시스템 primitive도 native shell로 고정했습니다.",
                            tone: .success
                        )
                    }
                }

                SectionCard {
                    VStack(alignment: .leading, spacing: 12) {
                        TBUIPopoverContent(text: "PopoverContent는 작은 보조 설명에 사용합니다.")
                        TBUITooltipContent(text: "TooltipContent")
                        TCSHintCard(
                            description: "파일 프리뷰에만 있던 hint card도 SwiftUI로 재구현했습니다.",
                            title: "TCSHintCard",
                            surface: .standalone
                        )
                    }
                }
            }
        }
    }
}

private struct FileOnlyPreviewSection: View {
    var body: some View {
        TBPageSection(
            title: "이식 참고 · File-Only Components",
            subtitle: "기존 파일 프리뷰 이력입니다. 예약과 Tastick 관련 견본은 현재 네이티브 제품 범위에 포함되지 않습니다."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                TasteMeasurementChecklistPanel()
                TasteMeasurementIntroPanel()
                TasteMeasurementPreparationPanel()
                TasteMeasurementActivePanel()
                TasteMeasurementCompletedPanel()
                ReservationConfirmationPanel()

                SectionCard {
                    VStack(alignment: .leading, spacing: 10) {
                        SectionTitle(title: "File preview registry", size: .medium)
                        Text("52개 React file preview entry를 native inventory로 고정했습니다. 화면 단위 파일은 기존 native screen route와 연결하고, 컴포넌트 파일은 이 카탈로그에서 렌더합니다.")
                            .font(TBFont.regular(12))
                            .foregroundStyle(TBColor.textBody)
                            .lineSpacing(3)
                        TBFlowLayout(spacing: 6) {
                            ForEach(NativeDesignSystemInventory.filePreviewEntries.prefix(24), id: \.self) { file in
                                Chip(
                                    title: file.replacingOccurrences(of: "src/components/", with: "").replacingOccurrences(of: "src/pages/", with: ""),
                                    size: .extraSmall,
                                    tone: .neutral,
                                    variant: .outline
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

private struct ProductCardsPreviewSection: View {
    let profile: TasteProfile

    private var dish: DiningDishFeedbackItem {
        TasteBuddyNativeContent.fallbackDishFeedbackItems.first ?? DiningDishFeedbackItem(
            id: "preview-dish",
            authorName: "나",
            restaurantName: "온지음",
            dishTitle: "맑은 육수 코스",
            summary: "감칠맛은 선명했지만 후반부의 무게가 가볍게 정리되어 편안하게 이어졌어요.",
            reactionLabel: "맑은 감칠맛",
            detailTags: ["여운이 깨끗함", "간이 과하지 않음"],
            tasteBubbles: [.umami, .sour],
            commentCount: 1,
            liked: true
        )
    }

    var body: some View {
        TBPageSection(
            title: "Product Cards",
            subtitle: "프로필 해석, 셰프 번역, 식사 피드백이 같은 카드 문법으로 연결됩니다."
        ) {
            VStack(alignment: .leading, spacing: 12) {
                PalateSignatureHeroCard(profile: profile)

                InterpretationCard(
                    description: "셰프에게는 조절점으로 전달됩니다",
                    eyebrow: "Chef translation",
                    supportingText: "강한 취향 요청이 아니라, 손님이 경험을 더 잘 받아들일 수 있는 시작 단서로 번역합니다.",
                    detailLabel: "가이드 보기",
                    accentColor: TasteAxis.umami.mainColor
                )

                ProfileConfidenceCard(
                    measurementAgeLabel: "오늘",
                    measurementCount: 2,
                    stage: .building,
                    strongestAxis: .umami,
                    weakestAxis: .salty
                )

                TasteMeasurementMiniCta(
                    actionLabel: "다시 측정",
                    actionFullWidth: true,
                    description: "컨디션이 달라졌다면 지금 다시 측정해 이번 분석을 최신 상태로 맞출 수 있어요.",
                    meta: "마지막 측정 오늘",
                    title: "현재 컨디션 다시 측정",
                    accentAxis: .umami,
                    onAction: {}
                )

                SectionCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Taste radar")
                            .font(TBFont.semibold(14))
                            .foregroundStyle(TBColor.textPrimary)
                        TasteRadarView(profile: profile, shouldAnimate: false)
                            .frame(maxWidth: TasteRadarContract.canvasSize.width)
                    }
                }

                TasteInsightSummaryCard(
                    data: .tasteProfile(profile),
                    onTap: {}
                )

                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 124), spacing: 10)],
                    alignment: .leading,
                    spacing: 10
                ) {
                    ForEach(ProfileMetricsPreview.data) { metric in
                        SummaryMetricCard(metric: metric)
                    }
                }

                NativeDishFeedbackCard(
                    item: dish,
                    absoluteDateLabel: "fixture",
                    relativeDateLabel: "오늘",
                    showsOptions: false
                )
            }
        }
    }
}

private struct StateRecipesPreviewSection: View {
    @State private var didRetry = false
    @State private var toastTitle = ""
    @State private var toastResult = ""
    @StateObject private var toast = TBToastPresenter()

    var body: some View {
        TBPageSection(
            title: "네이티브 상태 레시피",
            subtitle: "실제 로딩·재시도·빈 상태·토스트를 사용합니다. 아래 동작은 카탈로그 안에서만 실행됩니다."
        ) {
            VStack(spacing: 12) {
                SectionCard {
                    TBFlowLoadingState(message: "미각 설문을 준비하고 있어요")
                        .frame(height: 112)
                }
                SectionCard {
                    if didRetry {
                        PrimaryButton(title: "재시도 동작 확인 · 예시 다시 보기") { didRetry = false }
                    } else {
                        TBFlowRetryState(
                            title: "미각 설문을 불러오지 못했어요",
                            message: "잠시 후 다시 시도해 주세요.",
                            retry: { didRetry = true }
                        )
                    }
                }
                SectionCard {
                    EmptyState(
                        title: "아직 식사 피드백이 없습니다",
                        description: "첫 기록을 남기면 다음 다이닝의 조절점이 더 구체화됩니다.",
                        icon: .utensils
                    )
                }
                SectionCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("토스트 · 복사와 되돌리기").tbTextStyle(.caption)
                        PrimaryButton(title: "복사 완료 · 3.5초", size: .compact) {
                            toastTitle = "프로필 URL을 복사했어요"
                            toastResult = ""
                            toast.present(policy: .copyConfirmation)
                        }
                        PrimaryButton(title: "삭제 후 되돌리기 · 3.5초", size: .compact) {
                            toastTitle = "메뉴를 삭제했어요"
                            toastResult = ""
                            toast.present(policy: .undo) { toastResult = "되돌리기 표시가 종료됐어요." }
                        }
                        if toast.isPresented {
                            ToastSurface(
                                title: toastTitle,
                                actionTitle: toastTitle == "메뉴를 삭제했어요" ? "되돌리기" : nil,
                                action: {
                                    toast.cancel()
                                    toastResult = "메뉴를 되돌렸어요."
                                }
                            )
                        }
                        if !toastResult.isEmpty {
                            Text(toastResult).tbTextStyle(.caption)
                        }
                    }
                }
            }
        }
        .onDisappear { toast.cancel() }
    }
}

private struct TokenSwatchModel: Identifiable {
    let label: String
    let value: String
    let color: Color

    var id: String { label }

    static let foundation: [TokenSwatchModel] = [
        TokenSwatchModel(label: "bg.page", value: "#F3F3F3", color: TBColor.page),
        TokenSwatchModel(label: "surface", value: "#FFFFFF", color: TBColor.surface),
        TokenSwatchModel(label: "muted", value: "#F7F7F7", color: TBColor.mutedSurface),
        TokenSwatchModel(label: "elevated", value: "#FCFCFC", color: TBColor.elevatedSurface),
        TokenSwatchModel(label: "primary", value: "#0F0F0F", color: TBColor.textPrimary),
        TokenSwatchModel(label: "body", value: "#666666", color: TBColor.textBody),
        TokenSwatchModel(label: "success", value: "#2F8F5B", color: TBColor.success),
        TokenSwatchModel(label: "warning", value: "#A8661A", color: TBColor.warning)
    ]
}

private struct TokenSwatch: View {
    let swatch: TokenSwatchModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous)
                .fill(swatch.color)
                .frame(height: 48)
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous)
                        .stroke(TBColor.borderSubtle, lineWidth: 1)
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(swatch.label)
                    .font(TBFont.semibold(11))
                    .foregroundStyle(TBColor.textPrimary)
                Text(swatch.value)
                    .font(TBFont.regular(10))
                    .foregroundStyle(TBColor.textHint)
            }
        }
        .frame(width: 104, alignment: .leading)
        .padding(10)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.support, style: .continuous)
                .stroke(TBColor.borderCard)
        }
    }
}

private struct TokenPill: View {
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 6) {
            Text(label)
                .font(TBFont.medium(11))
                .foregroundStyle(TBColor.textBody)
            Text(value)
                .font(TBFont.semibold(11))
                .foregroundStyle(TBColor.textPrimary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous)
                .stroke(TBColor.borderCard)
        }
    }
}

private struct InventoryMetricPill: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(TBFont.bold(18))
                .foregroundStyle(TBColor.textPrimary)
            Text(label)
                .font(TBFont.medium(11))
                .foregroundStyle(TBColor.textBody)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TBColor.surface)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                .stroke(TBColor.borderCard)
        }
    }
}

private struct TastePaletteCard: View {
    let axis: TasteAxis

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                LucideIcon(
                    systemName: axis.symbol,
                    size: TBIcon.Size.small,
                    strokeWidth: TBIcon.Stroke.regular
                )
                    .frame(width: 28, height: 28)
                    .foregroundStyle(axis.mainColor)
                    .background(TBColor.surface)
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.icon, style: .continuous))
                Text(axis.label)
                    .font(TBFont.bold(14))
                    .foregroundStyle(axis.tintTextColor)
            }

            TasteChip(axis: axis, value: "taste")

            Text("해석이 필요한 곳에서만 의미 색으로 사용합니다.")
                .font(TBFont.regular(11))
                .foregroundStyle(axis.tintTextColor.opacity(0.72))
                .lineSpacing(2)
        }
        .padding(12)
        .frame(maxWidth: .infinity, minHeight: 132, alignment: .topLeading)
        .background(axis.tintColor)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TBRadius.card, style: .continuous)
                .stroke(axis.tintSoftBorderColor, lineWidth: 1)
        }
    }
}

private enum ProfileMetricsPreview {
    static let data: [ProfileActivityMetric] = [
        ProfileActivityMetric(
            id: "feedback",
            label: "식사 피드백",
            value: "2",
            symbol: "fork.knife",
            color: TasteAxis.umami.mainColor
        ),
        ProfileActivityMetric(
            id: "confidence",
            label: "프로필 단계",
            value: "Starter",
            symbol: "sparkles",
            color: TasteAxis.sour.mainColor
        )
    ]
}

#if canImport(PreviewsMacros)
    #Preview("Design System") {
        DesignSystemPreviewView()
    }
#endif
