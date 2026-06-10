import XCTest
import SwiftUI
@testable import TasteBuddy

final class SystemParityComponentTests: XCTestCase {
    func testChipContractKeepsReactVariantMatrix() {
        XCTAssertEqual(ChipSize.allCases.count, 3)
        XCTAssertEqual(ChipTone.allCases.count, 4)
        XCTAssertEqual(ChipVariant.allCases.count, 4)

        XCTAssertEqual(ChipSize.extraSmall.horizontalPadding, 8)
        XCTAssertEqual(ChipSize.small.horizontalPadding, 10)
        XCTAssertEqual(ChipSize.medium.horizontalPadding, 12)
        XCTAssertEqual(ChipSize.extraSmall.verticalPadding, 4)
        XCTAssertEqual(ChipSize.small.verticalPadding, 6)
        XCTAssertEqual(ChipSize.medium.verticalPadding, 8)
    }

    func testSearchOverlayShellMirrorsReactSearchChromeMetrics() {
        XCTAssertEqual(SearchOverlayShellMetrics.fieldHeight, 44)
        XCTAssertEqual(SearchOverlayShellMetrics.iconButtonSize, 44)
        XCTAssertEqual(SearchOverlayShellMetrics.headerHorizontalPadding, 20)
        XCTAssertEqual(SearchOverlayShellMetrics.headerGap, 12)
        XCTAssertEqual(SearchOverlayShellMetrics.bodyTopPadding, 16)
        XCTAssertEqual(SearchOverlayShellMetrics.bodyBottomPadding, 32)
        XCTAssertEqual(SearchOverlayShellMetrics.clearButtonSize, 28)
    }

    func testCompactCardMirrorsReactSlotMetrics() {
        XCTAssertEqual(CompactCardMetrics.padding, 12)
        XCTAssertEqual(CompactCardMetrics.gap, 12)
        XCTAssertEqual(CompactCardMetrics.radius, 20)
        XCTAssertEqual(CompactCardMetrics.mediaSize, 40)
        XCTAssertEqual(CompactCardMetrics.actionButtonSize, 32)
        XCTAssertEqual(CompactCardMetrics.actionIconSize, 24)
    }

    func testFlowSelectionAndStepComponentsMirrorReactMetrics() {
        XCTAssertEqual(FlowBottomCtaMetrics.horizontalPadding, 20)
        XCTAssertEqual(FlowBottomCtaMetrics.bottomPadding, 12)
        XCTAssertEqual(FlowBottomCtaMetrics.minHeight, 140)
        XCTAssertEqual(FlowBottomCtaMetrics.secondaryButtonGap, 8)
        XCTAssertEqual(FlowBottomCtaMetrics.stepIndicatorBottomMargin, 32)
        XCTAssertEqual(FlowBottomCtaMetrics.indicatorToHelperGap, 6)
        XCTAssertEqual(FlowBottomCtaMetrics.helperBottomMargin, 8)

        XCTAssertEqual(StepIndicatorMetrics.gap, 6)
        XCTAssertEqual(StepIndicatorMetrics.activeWidth, 16)
        XCTAssertEqual(StepIndicatorMetrics.inactiveWidth, 6)
        XCTAssertEqual(StepIndicatorMetrics.height, 6)

        XCTAssertEqual(SelectionCardMetrics.gap, 12)
        XCTAssertEqual(SelectionCardMetrics.padding, 16)
        XCTAssertEqual(SelectionCardMetrics.indicatorSize, 18)
        XCTAssertEqual(SelectionCardMetrics.indicatorTopPadding, 2)
        XCTAssertEqual(SelectionCardMetrics.radioDotSize, 8)
        XCTAssertEqual(SelectionCardMetrics.checkboxRadius, 6)
        XCTAssertEqual(SelectionCardMetrics.cardRadius, 20)
    }

    func testFlowAndSelectionComponentsExposeRemainingReactSlots() {
        XCTAssertEqual(PrimaryButtonSize.default.height, 48)
        XCTAssertEqual(PrimaryButtonSize.default.fontSize, 14)
        XCTAssertEqual(PrimaryButtonSize.compact.height, 40)
        XCTAssertEqual(PrimaryButtonSize.compact.fontSize, 12)

        let bottomCta = TBFlowBottomCTA(
            actionLabel: "계속",
            actionVisualDisabled: true,
            actionFullWidth: false,
            actionSize: .compact,
            secondaryButtonVisualDisabled: true,
            secondaryActionView: AnyView(Text("나중에 하기")),
            topSlot: AnyView(TBStepIndicator(currentIndex: 0, total: 3)),
            action: {}
        )
        XCTAssertTrue(bottomCta.actionVisualDisabled)
        XCTAssertFalse(bottomCta.actionFullWidth)
        XCTAssertEqual(bottomCta.actionSize, PrimaryButtonSize.compact)
        XCTAssertTrue(bottomCta.secondaryButtonVisualDisabled)
        XCTAssertNotNil(bottomCta.secondaryActionView)
        XCTAssertNotNil(bottomCta.topSlot)

        let stepCta = TBFlowStepCTA(
            actionLabel: "다음",
            currentIndex: 1,
            total: 4,
            actionVisualDisabled: true,
            stepLabel: "2 / 4",
            secondaryButtonVisualDisabled: true,
            action: {}
        )
        XCTAssertTrue(stepCta.actionVisualDisabled)
        XCTAssertEqual(stepCta.stepLabel, "2 / 4")
        XCTAssertTrue(stepCta.secondaryButtonVisualDisabled)

        let selectionCard = TBSelectionCard(
            title: "가벼운 시작이 좋아요",
            trailing: AnyView(StatusChip(title: "선택됨")),
            action: {}
        )
        XCTAssertNotNil(selectionCard.trailing)

        let header = TBFlowHeaderBlock(
            title: "식사 취향은 어떤 흐름에 가까운가요?",
            topLeftSlot: AnyView(OutlineBadge(title: "사전 조사")),
            topRightSlot: AnyView(StatusChip(title: "1 / 7"))
        )
        XCTAssertNotNil(header.topLeftSlot)
        XCTAssertNotNil(header.topRightSlot)
    }

    func testImageAvatarStatusAndEmptyStateMirrorReactSystemTokens() {
        XCTAssertEqual(TokenBoxMetrics.radius, 8)
        XCTAssertEqual(TokenBoxMetrics.smallSize, 32)
        XCTAssertEqual(TokenBoxMetrics.mediumSize, 40)
        XCTAssertEqual(TokenBoxMetrics.largeSize, 48)

        XCTAssertEqual(ImageBoxMetrics.radius, 8)
        XCTAssertEqual(ImageBoxMetrics.smallSize, 32)
        XCTAssertEqual(ImageBoxMetrics.mediumSize, 40)
        XCTAssertEqual(ImageBoxMetrics.largeSize, 48)
        XCTAssertEqual(ImageBoxMetrics.fallbackIconSmall, TBIcon.Size.small)
        XCTAssertEqual(ImageBoxMetrics.fallbackIconMedium, TBIcon.Size.medium)
        XCTAssertEqual(ImageBoxMetrics.fallbackIconLarge, TBIcon.Size.large)
        XCTAssertEqual(ChefImageResolver.bundledImageName(for: "강민구 셰프"), "KangMingoo")
        XCTAssertEqual(ChefImageResolver.bundledImageName(for: "온지음 셰프"), "OnjiumChefs")

        XCTAssertEqual(StatusChipMetrics.radius, 6)
        XCTAssertEqual(StatusChipMetrics.horizontalPadding, 6)
        XCTAssertEqual(StatusChipMetrics.verticalPadding, 2)
        XCTAssertEqual(StatusChipMetrics.fontSize, 10)

        XCTAssertEqual(EmptyStateMetrics.verticalPadding, 48)
        XCTAssertEqual(EmptyStateMetrics.horizontalPadding, 24)
        XCTAssertEqual(EmptyStateMetrics.gap, 16)
        XCTAssertEqual(EmptyStateMetrics.iconContainerSize, 32)
        XCTAssertEqual(EmptyStateMetrics.iconRadius, 14)
        XCTAssertEqual(EmptyStateMetrics.titleSize, 16)
        XCTAssertEqual(EmptyStateMetrics.descriptionSize, 13)

        XCTAssertEqual(TasteMatchRecommendationCardMetrics.width, 132)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.height, 132)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.radius, 20)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.padding, 12)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.gap, 12)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.avatarSize, 42)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.imageBoxSize.sideLength, 48)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.imageFallbackIconSize, 28)
        XCTAssertEqual(TasteMatchRecommendationCardMetrics.borderOpacity, 0.18)
    }

    func testOverlayAndBottomSheetShellMirrorReactChromeMetrics() {
        XCTAssertEqual(ActionOverlayCardMetrics.overlayOpacity, 0.35)
        XCTAssertEqual(ActionOverlayCardMetrics.horizontalPadding, 20)
        XCTAssertEqual(ActionOverlayCardMetrics.cardMaxWidth, 320)
        XCTAssertEqual(ActionOverlayCardMetrics.cardRadius, 20)
        XCTAssertEqual(ActionOverlayCardMetrics.stackPadding, 16)
        XCTAssertEqual(ActionOverlayCardMetrics.customContentHorizontalPadding, 20)
        XCTAssertEqual(ActionOverlayCardMetrics.customContentVerticalPadding, 16)
        XCTAssertEqual(ActionOverlayCardMetrics.actionHeight, 44)

        XCTAssertEqual(BottomSheetShellMetrics.overlayOpacity, 0.60)
        XCTAssertEqual(BottomSheetShellMetrics.stageHeightRatio, 0.95)
        XCTAssertEqual(BottomSheetShellMetrics.authEntryEmailMaxHeightRatio, 0.72)
        XCTAssertEqual(BottomSheetShellMetrics.stageTopInset, 12)
        XCTAssertEqual(BottomSheetShellMetrics.maxWidth, 1440)
        XCTAssertEqual(
            BottomSheetShellMetrics.stageHeight(screenHeight: 800, safeAreaTop: 47),
            701
        )
        XCTAssertEqual(BottomSheetShellMetrics.topRadius, 24)
        XCTAssertTrue(BottomSheetShellMetrics.clipsOnlyTopCorners)
        XCTAssertTrue(BottomSheetShellMetrics.usesCustomGrabber)
        XCTAssertEqual(BottomSheetShellMetrics.grabberTopMargin, 5)
        XCTAssertEqual(BottomSheetShellMetrics.grabberHeight, 5)
        XCTAssertEqual(BottomSheetShellMetrics.grabberToHeaderSpacing, 0)
        XCTAssertEqual(BottomSheetShellMetrics.grabberWidth, 36)
        XCTAssertEqual(BottomSheetShellMetrics.topAreaHeightIncludingGrabber, 10)
        XCTAssertEqual(BottomSheetShellMetrics.headerHorizontalPadding, 20)
        XCTAssertEqual(BottomSheetShellMetrics.headerBottomPadding, 16)
        XCTAssertEqual(BottomSheetShellMetrics.headerSlotSize, 40)
        XCTAssertEqual(BottomSheetShellMetrics.footerHorizontalPadding, 20)
        XCTAssertEqual(BottomSheetShellMetrics.footerTopPadding, 16)
        XCTAssertEqual(BottomSheetShellMetrics.footerBottomPadding, 12)
        XCTAssertEqual(BottomSheetShellMetrics.footerBottomPadding(safeAreaBottom: 0), 12)
        XCTAssertEqual(BottomSheetShellMetrics.footerBottomPadding(safeAreaBottom: 34), 34)
        XCTAssertEqual(BottomSheetShellMetrics.footerSafeAreaAccessoryTopGap, 12)
        XCTAssertEqual(BottomSheetShellMetrics.footerSafeAreaAccessoryHeight, 28)
        XCTAssertEqual(
            BottomSheetShellMetrics.footerSafeAreaHeight(
                safeAreaBottom: 0,
                accessoryHeight: nil
            ),
            12
        )
        XCTAssertEqual(
            BottomSheetShellMetrics.footerSafeAreaHeight(
                safeAreaBottom: 34,
                accessoryHeight: 28
            ),
            52
        )
        XCTAssertEqual(
            BottomSheetShellMetrics.footerSafeAreaHeight(
                safeAreaBottom: 34,
                accessoryHeight: 68
            ),
            92
        )
        XCTAssertEqual(BottomSheetShellMetrics.iconButtonSize, 32)
        XCTAssertEqual(BottomSheetShellMetrics.iconSize, TBIcon.Size.large)
    }

    func testNativeDesignSystemInventoryMirrorsReactDesignSystemPage() {
        XCTAssertEqual(NativeDesignSystemInventory.architectureGroups.count, 7)
        XCTAssertEqual(NativeDesignSystemInventory.totalArchitectureComponentCount, 59)
        XCTAssertEqual(NativeDesignSystemInventory.currentlyUsedComponentCount, 32)
        XCTAssertEqual(NativeDesignSystemInventory.unusedPrimitiveCount, 20)
        XCTAssertEqual(NativeDesignSystemInventory.componentStyleSpecCount, 30)
        XCTAssertEqual(NativeDesignSystemInventory.filePreviewEntries.count, 52)
        XCTAssertTrue(
            NativeDesignSystemInventory.filePreviewEntries.contains("src/components/system/TCSHintCard.tsx")
        )
        XCTAssertTrue(
            NativeDesignSystemInventory.filePreviewEntries.contains("src/pages/ReservationConfirmationScreen.tsx")
        )
    }

    func testNativeThemeMirrorsFullReactDesignTokenLayer() {
        XCTAssertEqual(TBTypography.FontSize.x10, 10)
        XCTAssertEqual(TBTypography.FontSize.x18, 18)
        XCTAssertEqual(TBTypography.FontSize.x28, 18)
        XCTAssertEqual(TBTypography.Weight.regular, 400)
        XCTAssertEqual(TBTypography.Weight.medium, 500)
        XCTAssertEqual(TBTypography.Weight.semibold, 600)
        XCTAssertEqual(TBTypography.Weight.bold, 700)
        XCTAssertEqual(TBTypography.LineHeight.tight, 1.2)
        XCTAssertEqual(TBTypography.LineHeight.snug, 1.35)
        XCTAssertEqual(TBTypography.LineHeight.normal, 1.4)
        XCTAssertEqual(TBTypography.LineHeight.relaxed, 1.5)
        XCTAssertEqual(TBTypography.LetterSpacing.tight, -0.24)
        XCTAssertEqual(TBTypography.LetterSpacing.micro, 0.14)

        XCTAssertEqual(TBSize.screenMaxWidth, 1440)
        XCTAssertEqual(TBSize.tasteLoopSize, 320)
        XCTAssertEqual(TBSize.tasteLoopGuideDotDiameter, 1)
        XCTAssertEqual(TBSize.tasteLoopGuideDotGap, 3)
        XCTAssertEqual(TBSize.tasteLoopGuideRadius, 138)
        XCTAssertEqual(TBSize.tasteLoopNodeRadius, 12)
        XCTAssertEqual(TBSize.tasteLoopOuterRingThickness, 24)
        XCTAssertEqual(TBSize.tasteLoopStepCount, 10)

        XCTAssertEqual(TBMotion.Duration.fast, 0.18)
        XCTAssertEqual(TBMotion.Duration.normal, 0.30)
        XCTAssertEqual(TBMotion.Duration.medium, 0.50)
        XCTAssertEqual(TBMotion.Duration.splash, 2.50)
        XCTAssertEqual(TBMotion.Scale.press, 0.98)
        XCTAssertEqual(TBMotion.Distance.onboardingSwipe, 100)

        XCTAssertEqual(TBDataViz.Progress.barHeight, 8)
        XCTAssertEqual(TBDataViz.Radar.size, 320)
        XCTAssertEqual(TBDataViz.Radar.labelSize, 10)
        XCTAssertEqual(TBDataViz.Radar.nodeSize, 3)
        XCTAssertEqual(TBDataViz.Trend.lineStrokeWidth, 1)
        XCTAssertEqual(TBDataViz.Trend.dotSize, 4)
        XCTAssertEqual(TBDataViz.Trend.activeDotSize, 5)
        XCTAssertEqual(TBDataViz.Ring.outerSize, 320)
        XCTAssertEqual(TBDataViz.Ring.stepCount, 10)
    }

    func testDesignColorTokenMirrorExposesCompleteReactColorLayer() {
        XCTAssertEqual(TBDesignColorTokens.ColorTokens.all.count, 33)
        XCTAssertEqual(TBDesignColorTokens.ShadowTokens.all.count, 5)
        XCTAssertEqual(TBDesignColorTokens.DataVizTokens.all.count, 7)
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.all.count, 150)
        XCTAssertEqual(TBDesignColorTokens.NeutralTasteTokens.all.count, 2)
        XCTAssertEqual(TBDesignColorTokens.designTokensAll.count, 192)
        XCTAssertEqual(TBDesignColorTokens.designTokensColorLikeAll.count, 197)

        XCTAssertEqual(TBDesignColorTokens.CSSVariables.Color.all.count, 33)
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.Shadow.all.count, 6)
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.DataViz.all.count, 7)
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.Taste.all.count, 78)
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.NeutralTaste.all.count, 2)
        XCTAssertEqual(TBDesignColorTokens.cssVariableAll.count, 126)
        XCTAssertEqual(Set(TBDesignColorTokens.cssVariableAll.compactMap(\.cssVariable)).count, 126)

        XCTAssertEqual(TBDesignColorTokens.ColorTokens.Background.page.rawValue, "#F3F3F3")
        XCTAssertEqual(TBDesignColorTokens.CSSVariables.Color.bgPage.rawValue, "#f3f3f3")
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.Sweet.paletteTokens.count, 10)
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.Sweet.nodeColors.count, 10)
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.all(for: .sweet).count, 25)
        XCTAssertEqual(TBDesignColorTokens.TasteTokens.paletteMain(for: .umami).rawValue, "#B372B4")
        XCTAssertEqual(
            TBDesignColorTokens.TasteTokens.Sweet.gradient.rawValue,
            "linear-gradient(135deg, #FF9900, #FFB84D)"
        )
        XCTAssertEqual(
            TBDesignColorTokens.TasteTokens.Sweet.ringBaseColorSoft.value,
            .hexRGBA(0xFFEBCC1A)
        )
        XCTAssertEqual(
            TBDesignColorTokens.CSSVariables.Taste.Sweet.ringBase.value,
            .alias(cssVariable: "--tb-taste-sweet-tint-surface")
        )
        XCTAssertEqual(
            TBDesignColorTokens.CSSVariables.byVariable["--tb-taste-fat-ring-base"]?.rawValue,
            "var(--tb-taste-fat-tint-surface)"
        )
    }

    func testDesignFoundationTokenMirrorExposesCompleteReactTokenLayer() {
        XCTAssertEqual(TBDesignFoundationTokens.SpacingTokens.all.count, 10)
        XCTAssertEqual(TBDesignFoundationTokens.RadiusTokens.all.count, 8)
        XCTAssertEqual(TBDesignFoundationTokens.TypographyTokens.all.count, 24)
        XCTAssertEqual(TBDesignFoundationTokens.ShadowTokens.all.count, 5)
        XCTAssertEqual(TBDesignFoundationTokens.MotionTokens.all.count, 22)
        XCTAssertEqual(TBDesignFoundationTokens.IconTokens.all.count, 18)
        XCTAssertEqual(TBDesignFoundationTokens.BoxTokens.all.count, 3)
        XCTAssertEqual(TBDesignFoundationTokens.DataVizTokens.all.count, 21)
        XCTAssertEqual(TBDesignFoundationTokens.LayoutTokens.all.count, 20)
        XCTAssertEqual(TBDesignFoundationTokens.foundationAll.count, 131)

        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Card.all.count, 4)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Button.all.count, 6)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Badge.all.count, 3)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Chip.Size.all.count, 15)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Chip.Tone.all.count, 48)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Chip.all.count, 64)
        XCTAssertEqual(TBDesignFoundationTokens.ComponentTokens.Pill.all.count, 1)
        XCTAssertEqual(TBDesignFoundationTokens.componentAll.count, 78)
        XCTAssertEqual(TBDesignFoundationTokens.designTokensAll.count, 209)

        XCTAssertEqual(TBDesignFoundationTokens.CSSVariables.nonColorAll.count, 121)
        XCTAssertEqual(
            Set(TBDesignFoundationTokens.CSSVariables.nonColorAll.compactMap(\.cssVariable)).count,
            121
        )

        XCTAssertEqual(TBDesignFoundationTokens.SpacingTokens.x20.rawValue, "20px")
        XCTAssertEqual(TBDesignFoundationTokens.RadiusTokens.full.value, .pixels(9999))
        XCTAssertEqual(TBDesignFoundationTokens.TypographyTokens.FontSize.x28.rawValue, "18px")
        XCTAssertEqual(TBDesignFoundationTokens.MotionTokens.DurationMs.splash.value, .milliseconds(2500))
        XCTAssertEqual(TBDesignFoundationTokens.IconTokens.Size.base.cssVariable, nil)
        XCTAssertEqual(TBDesignFoundationTokens.LayoutTokens.sectionGap.rawValue, "SPACING_TOKENS[20]")
        XCTAssertEqual(TBDesignFoundationTokens.LayoutTokens.sectionGap.value, .alias("SPACING_TOKENS.20"))

        let cssSectionGap = TBDesignFoundationTokens.CSSVariables.nonColorAll.first {
            $0.cssVariable == "--tb-layout-section-gap"
        }
        XCTAssertEqual(cssSectionGap?.rawValue, "20px")

        let cssChipRadius = TBDesignFoundationTokens.CSSVariables.nonColorAll.first {
            $0.cssVariable == "--tb-chip-radius"
        }
        XCTAssertEqual(cssChipRadius?.rawValue, "var(--tb-radius-full)")
        XCTAssertEqual(cssChipRadius?.value, .alias("--tb-radius-full"))
    }

    func testProfileConfidenceStageCopyMatchesReactContract() {
        XCTAssertEqual(
            ProfileConfidenceStage.allCases.map(\.rawValue),
            ["Starter", "Building", "Refined"]
        )
        XCTAssertEqual(ProfileConfidenceStage.starter.caption, "첫 측정 기준")
        XCTAssertEqual(ProfileConfidenceStage.building.caption, "반복 학습 중")
        XCTAssertEqual(ProfileConfidenceStage.refined.caption, "충분히 안정화")
        XCTAssertTrue(ProfileConfidenceStage.building.title.contains("Building"))
        XCTAssertTrue(ProfileConfidenceStage.refined.nextStep.contains("예약"))
    }

    func testFreshProfileUsesTodayMeasurementAgeLabel() {
        let profile = TasteProfile(
            createdAt: .now,
            scores: Dictionary(
                uniqueKeysWithValues: TasteAxis.allCases.map { ($0.rawValue, 50) }
            ),
            confidence: "Starter",
            summary: "fixture",
            topAxes: [.sweet, .sour],
            cautionAxis: .fat
        )

        XCTAssertEqual(profile.measurementAgeLabel, "오늘")
    }

    func testAppChromeMatchesReactShellContract() {
        XCTAssertEqual(TBSize.topAppBarHeight, 56)
        XCTAssertEqual(TBSize.bottomTabBarHeight, 60)
        XCTAssertEqual(AppChromeMetrics.actionButtonSize, 40)
        XCTAssertEqual(AppChromeMetrics.iconSize, TBIcon.Size.large)
        XCTAssertEqual(AppChromeMetrics.actionGap, 8)
        XCTAssertEqual(AppChromeMetrics.avatarSize, 32)
        XCTAssertEqual(AppChromeMetrics.tabHorizontalPadding, 16)
        XCTAssertEqual(AppChromeMetrics.tabLabelTracking, 0.14)
        XCTAssertEqual(
            MainTab.allCases.map(\.rawValue),
            ["home", "analysis", "dining", "profile"]
        )
        XCTAssertEqual(
            MainTab.allCases.map(\.title),
            ["홈", "나의 입맛", "다이닝", "프로필"]
        )
        XCTAssertEqual(
            TopAppBarPrimaryAction.measurement.accessibilityLabel,
            "미각 측정 시작"
        )
        XCTAssertEqual(
            TopAppBarPrimaryAction.search.accessibilityLabel,
            "통합 검색 열기"
        )
    }

    func testLucideIconTokensMirrorReactIconTokens() {
        XCTAssertEqual(TBIcon.Size.extraSmall, 12)
        XCTAssertEqual(TBIcon.Size.small, 14)
        XCTAssertEqual(TBIcon.Size.base, 16)
        XCTAssertEqual(TBIcon.Size.medium, 18)
        XCTAssertEqual(TBIcon.Size.control, 20)
        XCTAssertEqual(TBIcon.Size.large, 24)
        XCTAssertEqual(TBIcon.Size.extraLarge, 28)
        XCTAssertEqual(TBIcon.Size.touch, 24)
        XCTAssertEqual(TBIcon.Size.hero, 24)

        XCTAssertEqual(TBIcon.Stroke.thin, 1.5)
        XCTAssertEqual(TBIcon.Stroke.regular, 1.8)
        XCTAssertEqual(TBIcon.Stroke.medium, 2)
        XCTAssertEqual(TBIcon.Stroke.strong, 2.2)
        XCTAssertEqual(TBIcon.Stroke.emphasis, 3)

        XCTAssertEqual(TBIcon.Container.small, 18)
        XCTAssertEqual(TBIcon.Container.medium, 24)
        XCTAssertEqual(TBIcon.Container.large, 32)
        XCTAssertEqual(TBIcon.Container.extraLarge, 32)
    }

    func testLucideIconNameMapsLegacySystemSymbolsToReactLucideNames() {
        XCTAssertEqual(LucideIconName(systemName: "magnifyingglass"), .search)
        XCTAssertEqual(LucideIconName(systemName: "bell"), .bell)
        XCTAssertEqual(LucideIconName(systemName: "plus.circle"), .circlePlus)
        XCTAssertEqual(LucideIconName(systemName: "line.3.horizontal"), .menu)
        XCTAssertEqual(LucideIconName(systemName: "calendar.badge.checkmark"), .calendarCheck)
        XCTAssertEqual(LucideIconName(systemName: "person"), .user)
        XCTAssertEqual(LucideIconName(systemName: "heart.fill"), .heart)
        XCTAssertEqual(LucideIconName(systemName: "bookmark.fill"), .bookmark)
        XCTAssertEqual(LucideIconName(systemName: "text.bubble"), .messageCircle)
        XCTAssertEqual(LucideIconName(systemName: "paperplane"), .send)
    }

    func testDishFeedbackFixturesKeepReactImageRailContract() {
        let followingItems = TasteBuddyNativeContent.followingDishFeedbackItems
        let firstFollowingImage = followingItems[0].images.first

        XCTAssertEqual(firstFollowingImage?.alt, "맑은 육수와 산뜻한 여운 메뉴 사진")
        XCTAssertFalse(firstFollowingImage?.isUserFeedbackMedia ?? true)
        XCTAssertTrue(
            followingItems[1].images.allSatisfy { !$0.isUserFeedbackMedia },
            "React DishFeedbackImageRail renders only feedback images with imageSrc."
        )

        let diningItems = TasteBuddyNativeContent.fallbackDishFeedbackItems
        XCTAssertFalse(diningItems[0].images.first?.isUserFeedbackMedia ?? true)
        XCTAssertTrue(diningItems[1].images.allSatisfy { !$0.isUserFeedbackMedia })

        let feedbackImages = (followingItems + diningItems).flatMap(\.images)
        XCTAssertFalse(
            feedbackImages.contains { ["OnjiumChefs", "KangMingoo"].contains($0.imageName) },
            "Dish feedback media must be user-uploaded reflection photos, not chef portraits."
        )
    }

    func testDishFeedbackTasteBubblesKeepReactCardViewModelContract() {
        let firstFollowingItem = TasteBuddyNativeContent.followingDishFeedbackItems[0]
        let firstBubble = firstFollowingItem.tasteBubbles[0]

        XCTAssertEqual(firstBubble.label, "맑은 감칠맛")
        XCTAssertEqual(firstBubble.colorTaste, "감칠맛")
        XCTAssertEqual(firstBubble.resolvedAxis, .umami)
        XCTAssertTrue(
            firstFollowingItem.tasteBubbles.allSatisfy { !$0.id.isEmpty && !$0.label.isEmpty },
            "React DishFeedbackCard tasteBubbles keep id, label, title/colorTaste metadata."
        )
    }

    func testDishFeedbackDetailTagsKeepReactCardViewModelContract() {
        let firstFollowingItem = TasteBuddyNativeContent.followingDishFeedbackItems[0]
        let firstTag = firstFollowingItem.detailTags[0]

        XCTAssertEqual(firstTag.id, "following-mina-broth-lexicon-detail-note-broth-aroma")
        XCTAssertEqual(firstTag.label, "육수 향")
        XCTAssertEqual(firstTag.title, "향 신호")
        XCTAssertEqual(
            firstFollowingItem.tbaAnalysisSnapshot?.source,
            "TasteBuddyAgent"
        )
        XCTAssertTrue(
            firstFollowingItem.detailTags.allSatisfy { !$0.id.isEmpty && !$0.label.isEmpty },
            "React DishFeedbackCard detailTags keep id, label, and optional title metadata."
        )
    }

    func testSocialDishFeedbackCardWrapperBuildsNativeTBAViewModel() {
        let feedItem = TasteBuddyNativeContent.tasteMatchFeed[0]
        let card = DiningDishFeedbackItem.fromTasteMatchFeedItem(
            feedItem,
            commentCount: 3,
            liked: true
        )

        XCTAssertEqual(card.id, feedItem.id)
        XCTAssertEqual(card.authorName, feedItem.reviewerName)
        XCTAssertEqual(card.restaurantName, feedItem.restaurantName)
        XCTAssertEqual(card.dishTitle, feedItem.dishTitle)
        XCTAssertEqual(card.commentCount, 3)
        XCTAssertTrue(card.liked)
        XCTAssertEqual(card.tbaAnalysisSnapshot?.source, "TasteBuddyAgent")
        XCTAssertFalse(card.tasteBubbles.isEmpty)
        XCTAssertFalse(card.detailTags.isEmpty)
        XCTAssertFalse(
            card.images.first?.isUserFeedbackMedia ?? true,
            "SocialDishFeedbackCard mirrors React's alt-only image view model; no placeholder chef photo may render."
        )
    }

    func testFixtureDishFeedbackFeedHydratesTasteMatchItemsThroughSocialCardContract() async throws {
        let phase = try await FixtureDishFeedbackFeedRepository().followingFeed()

        guard case .populated(let items) = phase else {
            return XCTFail("Fixture repository should hydrate populated social dish cards.")
        }

        XCTAssertEqual(items.count, TasteBuddyNativeContent.tasteMatchFeed.count)
        XCTAssertEqual(items.first?.id, TasteBuddyNativeContent.tasteMatchFeed.first?.id)
        XCTAssertEqual(items.first?.tbaAnalysisSnapshot?.source, "TasteBuddyAgent")
        XCTAssertFalse(items.first?.tasteBubbles.isEmpty ?? true)
    }

    func testFeedbackReflectionMediaLifecyclePolicyMatchesPrivateR2Plan() {
        let objectKey = FeedbackReflectionMediaPolicy.privateObjectKey(
            userID: "user-123",
            date: Date(timeIntervalSince1970: 1_720_000_000),
            assetID: "asset-456"
        )

        XCTAssertTrue(objectKey.hasPrefix("feedback-reflections/user-123/"))
        XCTAssertTrue(objectKey.hasSuffix("/asset-456.jpg"))
        XCTAssertEqual(FeedbackReflectionMediaPolicy.maxUploadBytes, 6 * 1024 * 1024)
        XCTAssertEqual(FeedbackReflectionMediaPolicy.recommendedMaxPixelLength, 1600)
        XCTAssertTrue(FeedbackReflectionMediaPolicy.supportedContentTypes.contains("image/webp"))
        XCTAssertEqual(
            FeedbackReflectionMediaLifecycleAction.allCases,
            [.upload, .read, .replace, .delete, .accountCleanup]
        )
    }

    func testRadarContractMatchesReactAxisAndReferenceValues() {
        XCTAssertEqual(TasteRadarContract.canvasSize, CGSize(width: 320, height: 310))
        XCTAssertEqual(TasteRadarContract.center, CGPoint(x: 160, y: 145))
        XCTAssertEqual(TasteRadarContract.maximumRadius, 100)
        XCTAssertEqual(TasteRadarContract.gridLevels, [0.25, 0.5, 0.75, 1])
        XCTAssertEqual(
            TasteAxis.allCases.map(TasteRadarContract.averageScore(for:)),
            [50, 44, 55, 48, 52, 40]
        )
    }

    func testRadarHexagonUsesReactStartingAngle() {
        let first = TasteRadarContract.basePoint(index: 0)
        let second = TasteRadarContract.basePoint(index: 1)
        let right = TasteRadarContract.basePoint(index: 2)
        let left = TasteRadarContract.basePoint(index: 5)

        XCTAssertEqual(first.x, 110, accuracy: 0.001)
        XCTAssertEqual(first.y, 58.397, accuracy: 0.001)
        XCTAssertEqual(second.x, 210, accuracy: 0.001)
        XCTAssertEqual(second.y, 58.397, accuracy: 0.001)
        XCTAssertEqual(right.x, 260, accuracy: 0.001)
        XCTAssertEqual(right.y, 145, accuracy: 0.001)
        XCTAssertEqual(left.x, 60, accuracy: 0.001)
        XCTAssertEqual(left.y, 145, accuracy: 0.001)
    }

    func testRadarMeasurementNormalizesInputAndClampsScores() {
        let snapshot = RadarMeasurementSnapshot(
            id: "fixture",
            periodLabel: "최근 측정",
            entries: [
                RadarTasteEntry(axis: .sour, score: 140, averageScore: -20),
                RadarTasteEntry(axis: .sweet, score: 85)
            ],
            totalSensitivityLabel: "민감"
        )

        XCTAssertEqual(snapshot.entries.map(\.axis), TasteAxis.allCases)
        XCTAssertEqual(snapshot.entries[0].score, 85)
        XCTAssertEqual(snapshot.entries[1].score, 100)
        XCTAssertEqual(snapshot.entries[1].averageScore, 0)
        XCTAssertEqual(snapshot.entries[2].score, 50)
    }

    func testRadarAnimationUsesReactTimingCurveBounds() {
        XCTAssertEqual(TasteRadarContract.animationProgress(-1), 0)
        XCTAssertEqual(TasteRadarContract.animationProgress(0), 0)
        XCTAssertEqual(TasteRadarContract.animationProgress(1), 1)
        XCTAssertEqual(TasteRadarContract.animationProgress(2), 1)
        XCTAssertGreaterThan(TasteRadarContract.animationProgress(0.5), 0.5)
    }

    func testPalateSignatureRulesMatchReactPriorityOrder() {
        let harmonist = PalateSignatureEngine.derive(
            entries: TasteAxis.allCases.map {
                RadarTasteEntry(
                    axis: $0,
                    score: TasteRadarContract.averageScore(for: $0)
                )
            }
        )
        XCTAssertEqual(harmonist.id, .harmonist)
        XCTAssertEqual(harmonist.label, "Harmonist")

        let epicure = PalateSignatureEngine.derive(
            entries: TasteAxis.allCases.map { axis in
                let score = switch axis {
                case .umami: 72
                case .fat: 50
                case .sour: 34
                default: TasteRadarContract.averageScore(for: axis)
                }
                return RadarTasteEntry(axis: axis, score: score)
            }
        )
        XCTAssertEqual(epicure.id, .epicure)
        XCTAssertEqual(epicure.accentAxes.first, .umami)
    }

    func testMeasurementMiniCtaKeepsReactVariantMatrix() {
        XCTAssertEqual(TasteMeasurementMiniCtaTone.allCases.count, 2)
        XCTAssertEqual(TasteMeasurementMiniCtaPadding.allCases.count, 2)
        XCTAssertEqual(TasteMeasurementMiniCtaActionPlacement.allCases.count, 2)
        XCTAssertEqual(TasteMeasurementMiniCtaPadding.compact.value, 12)
        XCTAssertEqual(TasteMeasurementMiniCtaPadding.default.value, 16)
    }

    func testTasteInsightSummarySelectsIncreaseAndDecreaseSignals() {
        let data = TasteInsightSummaryCardData(
            actionLabel: "현재 기준",
            details: [
                TasteInsightSummaryDetail(
                    axis: .sweet,
                    changeValue: 12,
                    history: [],
                    trend: .increase
                ),
                TasteInsightSummaryDetail(
                    axis: .sour,
                    changeValue: 28,
                    history: [],
                    trend: .increase
                ),
                TasteInsightSummaryDetail(
                    axis: .bitter,
                    changeValue: -22,
                    history: [],
                    trend: .decrease
                )
            ],
            keywords: ["신맛 반응", "쓴맛 대비"],
            sectionLabel: "미각변화",
            title: "fixture"
        )

        XCTAssertEqual(data.details.count, 3)
        XCTAssertEqual(data.details[1].changeLabel, "+28%")
        XCTAssertEqual(data.details[2].changeLabel, "-22%")
        XCTAssertEqual(TastePointTrend.allCases, [.increase, .decrease, .neutral])
    }
}
