import SwiftUI
import PhotosUI

struct FoodMemoryResultsView: View {
    @EnvironmentObject private var appModel: AppModel
    let query: String
    @State private var filter: FoodMemoryFilter = .all
    @State private var result: FoodMemoryIndex.Result?
    @State private var resultKey = ""
    @State private var selected: UUID?
    @State private var showsComparison = false
    @State private var comparesAll = false
    @State private var displayLimit = 40
    private var requestKey: String { appModel.foodMemoryIndex.generation.uuidString + "|" + String(appModel.foodMemoryIndex.analysisReady) + "|" + filter.rawValue + "|" + query }

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x16) {
            Text("현재 계정에 저장한 모든 기록에서 찾아요. 검색어는 이 기기에서만 사용해요.")
                .font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary)
            Picker("평가 범위", selection: $filter) {
                ForEach(FoodMemoryFilter.allCases) { Text($0.rawValue).tag($0) }
            }.pickerStyle(.menu)
            Button("모든 경험의 공통점·예외·시간 비교") { comparesAll = true; showsComparison = true }
            if appModel.hasUnreadableFoodMemory {
                Text(appModel.diningPersistenceError ?? "저장 원본을 읽지 못했어요.").font(TBFont.regular(14))
            } else if appModel.foodMemoryIndex.generation != appModel.memoryGeneration && appModel.sensoryAnalysisIsUpdating {
                ProgressView("저장한 기록 준비 중")
            } else if resultKey == requestKey, let result {
                Text(result.interpretation).font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
                Text("전체 \(result.searchedCount)개 조회 · 일치 \(result.candidates.count)개 · 평가 필터 \(result.matches.count)개")
                    .font(TBFont.medium(12)).foregroundStyle(TBColor.textPrimary)
                if !appModel.foodMemoryIndex.analysisReady {
                    Text(appModel.sensoryAnalysisError ?? "원문은 검색할 수 있어요. 평가 해석을 갱신하고 있어요.")
                        .font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
                }
                if !result.candidates.isEmpty {
                    Button("이 검색 범위의 경험 비교") { comparesAll = false; showsComparison = true }
                        .accessibilityHint("평가 필터로 숨긴 반례와 미확인 기록도 함께 비교합니다")
                }
                if result.matches.isEmpty {
                    Text(result.searchedCount == 0 ? "아직 저장한 음식 기억이 없어요." : "이 범위에 맞는 기록이 없어요. 모든 기록으로 바꾸거나 음식 이름·원문 일부로 찾아보세요.")
                        .font(TBFont.regular(14)).foregroundStyle(TBColor.textSecondary)
                }
                LazyVStack(spacing: TBSpacing.x12) {
                    ForEach(Array(result.matches.prefix(displayLimit))) { doc in
                        Button { selected = doc.id } label: { FoodMemoryRow(document: doc) }.buttonStyle(.plain)
                    }
                    if result.matches.count > displayLimit {
                        Button("다음 기록 보기 · 현재 \(min(displayLimit, result.matches.count))개 표시") { displayLimit += 40 }
                    }
                }
            } else { ProgressView("기록 찾는 중") }
        }
        .task(id: requestKey) {
            let key = requestKey, index = appModel.foodMemoryIndex, term = query, selectedFilter = filter
            displayLimit = 40
            do { try await Task.sleep(for: .milliseconds(150)) } catch { return }
            let worker = Task.detached(priority: .userInitiated) { index.search(term, filter: selectedFilter) }
            let response = await withTaskCancellationHandler { await worker.value } onCancel: { worker.cancel() }
            guard !Task.isCancelled, key == requestKey else { return }
            result = response; resultKey = key
        }
        .sheet(isPresented: Binding(get: { selected != nil }, set: { if !$0 { selected = nil } })) {
            if let selected { FoodMemoryDetailView(entryID: selected) }
        }
        .sheet(isPresented: $showsComparison) {
            FoodMemoryComparisonView(scope: comparesAll ? .all : .query(query))
        }
    }
}

struct FoodMemoryRow: View {
    let document: FoodMemoryDocument
    var showsConditions = false
    private static let dishKindLabels: [String: String] = Dictionary(uniqueKeysWithValues:
        ((try? DiningFeedbackFixtureLoader.load())?.allDishKindOptions ?? []).map { ($0.id, $0.label) })
    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: TBSpacing.x8) {
                Text(document.entry.menu.isEmpty ? "메뉴 미기록" : document.entry.menu).font(TBFont.semibold(16)).foregroundStyle(TBColor.textPrimary)
                Text(document.entry.restaurant).font(TBFont.medium(13)).foregroundStyle(TBColor.textSecondary)
                Text(document.entry.memoryDateDescription).font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
                Text(document.evaluationLabel).font(TBFont.medium(12)).foregroundStyle(TBColor.textPrimary)
                Text(document.isGeneratedNote ? "이전 자동 생성 메모 · 직접 호감 응답 아님" : "저장한 원문·직접 응답")
                    .font(TBFont.medium(11)).foregroundStyle(TBColor.textSecondary)
                Text(document.excerpt).font(TBFont.regular(14)).foregroundStyle(TBColor.textBody).lineLimit(5)
                if showsConditions {
                    ForEach(document.recordedConditions, id: \.self) { Text($0).font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary) }
                    Text("음식 분류: \(document.entry.dishKindIDs.isEmpty ? "미기록" : document.entry.dishKindIDs.map { Self.dishKindLabels[$0] ?? "미확인 분류" }.joined(separator: " · ")) · 확인 출처 미상")
                        .font(TBFont.regular(11)).foregroundStyle(TBColor.textSecondary)
                }
                Text("원본 열기 · 수정").font(TBFont.medium(12)).foregroundStyle(TBColor.textPrimary)
            }.frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

extension DiningEntry {
    var memoryDateDescription: String {
        let format: (Date) -> String = { $0.formatted(.dateTime.year().month().day().locale(Locale(identifier: "ko_KR"))) }
        if let mealTime {
            if mealTime.source == .approximate, let start = mealTime.start, let end = mealTime.end { return "\(mealTime.source.label) · \(format(start))–\(format(end))" }
            if let date = mealTime.start, [.confirmed, .photoCandidate].contains(mealTime.source) { return "\(mealTime.source.label) · \(format(date))" }
            return mealTime.source.label + (savedAt.map { " · 기록일 \(format($0))" } ?? " · 기록일도 미상")
        }
        return "\(format(date)) · \(mealTimeLabel)"
    }
}

/// 검색·피드 상세·분석 근거·Taste Change가 동일한 현재 원본을 연다.
struct FoodMemoryDetailView: View {
    @Environment(\.tbSystemColorScheme) private var systemColorScheme
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let entryID: UUID
    @State private var showsOptions = false
    @State private var pendingOption: FoodMemoryOption?
    @State private var optionsDragTranslation: CGFloat = 0
    @State private var isDraggingOptions = false
    @State private var optionsDragBaseline: CGFloat = 0
    @State private var optionsDragWaitedForScroll = false
    @StateObject private var optionsScrollCoordinator = BottomSheetScrollCoordinator()
    @State private var showsPhotoPicker = false
    @State private var photoPickerItems: [PhotosPickerItem] = []
    @State private var showsPhotoManager = false
    @State private var isSavingPhoto = false
    @State private var photoError: String?
    @State private var fieldEdit: FoodMemoryFieldEdit?
    @State private var showsNoteEditor = false
    @State private var showsFullEditor = false
    @State private var selectedRestaurant: RestaurantSummary?
    @State private var showsHistory = false
    @State private var showsLegacySummary = false
    @State private var showsDelete = false
    @State private var selectedTaste: FoodMemoryTaste?
    @State private var topBarPhoto: CGImage?
    @State private var photoFrame = CGRect.zero
    @State private var statusBarFrame = CGRect.zero
    @State private var photoScrollCoordinateSpace = UUID()
    private var entry: DiningEntry? { appModel.diningEntry(id: entryID) }
    private var photoBackdrop: TopAppBarPhotoBackdrop? {
        guard entry?.allReflectionPhotoFilenames.contains(where: DiningReflectionPhotoStore.isValidFilename) == true,
              let topBarPhoto else { return nil }
        return .init(image: topBarPhoto, frame: photoFrame)
    }
    private var statusBarColorScheme: ColorScheme {
        photoBackdrop?.iconTone(in: statusBarFrame) == .light ? .dark : .light
    }

    private var recordScreen: some View {
        ZStack(alignment: .top) {
            ScrollView {
                if let entry {
                    recordContent(entry)
                } else {
                    Text("삭제되었거나 현재 계정에서 볼 수 없는 기록이에요.")
                        .font(TBFont.regular(15))
                        .foregroundStyle(TBColor.textSecondary)
                        .tbPageContentPadding()
                        .padding(.top, TBSize.chromeIconButton)
                }
            }
            .coordinateSpace(name: photoScrollCoordinateSpace)
            .scrollIndicators(.hidden)
            .scrollBounceBehavior(.always, axes: .vertical)
            .ignoresSafeArea(.container, edges: entry == nil ? [] : .top)

            TopAppBar(
                appearance: .glass,
                showBack: true,
                showsDefaultActions: false,
                rightActions: entry == nil ? [] : [
                    .init(id: "record-options", symbol: "ellipsis", accessibilityLabel: "기록 옵션") {
                        openOptionsSheet()
                    }
                ],
                onBack: { dismiss() }
            )
            .environment(\.tbTopAppBarPhotoBackdrop, photoBackdrop)
            // 화면 호스트의 안전영역은 고정한다. 축소되어도 헤더 위 이미지 영역을 유지한다.
            .padding(.top, optionsSafeAreaTop)
        }
        .toolbar(.hidden, for: .navigationBar)
        .tbPageBackground(TBColor.surface)
        .onGeometryChange(for: CGRect.self, of: { geometry in
            let frame = geometry.frame(in: .global)
            return CGRect(x: frame.minX, y: frame.minY,
                          width: frame.width, height: optionsSafeAreaTop)
        }) { statusBarFrame = $0 }
    }

    var body: some View {
        GeometryReader { proxy in
            let screenSize = UIScreen.main.bounds.size
            let screenOriginY = proxy.frame(in: .global).minY
            ZStack(alignment: .bottom) {
                Color.black.opacity(optionsProgress)
                    .ignoresSafeArea()
                    .contentShape(Rectangle())
                    .onTapGesture { closeOptionsSheet() }
                    .allowsHitTesting(showsOptions)
                    .accessibilityHidden(true)

                StagedSheetScreen(
                    progress: optionsProgress,
                    dimOpacity: BottomSheetShellMetrics.overlayOpacity * optionsProgress,
                    animates: !isDraggingOptions,
                    openOffsetY: optionsSafeAreaTop + StagedBottomSheetBackgroundMetrics.openOffsetY,
                    isAccessibilityHidden: showsOptions
                ) {
                    recordScreen
                }
                    .frame(width: proxy.size.width, height: screenSize.height)
                    .position(x: proxy.size.width / 2, y: screenSize.height / 2 - screenOriginY)
                    .allowsHitTesting(!showsOptions)
                    .zIndex(1)

                if showsOptions, let entry {
                    FoodMemoryOptionsSheet(entry: entry, isSavingPhoto: isSavingPhoto,
                                           onClose: { closeOptionsSheet() }) { option in
                        closeOptionsSheet(selecting: option)
                    }
                    .environment(\.bottomSheetScrollCoordinator, optionsScrollCoordinator)
                    .frame(width: proxy.size.width, height: optionsSheetHeight, alignment: .bottom)
                    .position(x: proxy.size.width / 2,
                              y: screenSize.height - optionsSheetHeight / 2 - screenOriginY + optionsDragTranslation)
                    .simultaneousGesture(optionsDragGesture)
                    .accessibilityAddTraits(.isModal)
                    .transition(TasteBloomMotion.sheetTransition(reduceMotion: reduceMotion))
                    .zIndex(2)
                }
            }
            .animation(isDraggingOptions ? nil : TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion),
                       value: optionsProgress)
            .background(TBColor.surface.ignoresSafeArea())
        }
        .edgeSwipeBack {
            if showsOptions { closeOptionsSheet() } else { dismiss() }
        }
        .accessibilityAction(.escape) {
            if showsOptions { closeOptionsSheet() } else { dismiss() }
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in
            pendingOption = nil
            fieldEdit = nil
            showsNoteEditor = false
            selectedRestaurant = nil
            showsOptions = false
            resetOptionsDrag()
            dismiss()
        }
        .photosPicker(isPresented: $showsPhotoPicker, selection: $photoPickerItems,
                      maxSelectionCount: max(1, FoodMemoryDetailPresentation.maximumPhotoCount - (entry?.allReflectionPhotoFilenames.count ?? 0)),
                      selectionBehavior: .ordered, matching: .images)
        .onChange(of: showsPhotoPicker) { _, isPresented in
            if isPresented { photoPickerItems = [] }
        }
        .task(id: photoPickerItems) { await savePhotos(photoPickerItems) }
        .sheet(isPresented: $showsPhotoManager) {
            FoodMemoryPhotoManager(entryID: entryID, pickerItems: $photoPickerItems, isSaving: $isSavingPhoto,
                                   importError: $photoError, onRemove: removePhoto)
        }
        .sheet(item: $fieldEdit) { edit in
            FoodMemoryFieldEditor(edit: edit)
        }
        .fullScreenCover(isPresented: $showsNoteEditor) {
            if let entry { FoodMemoryNoteEditor(original: entry, accountGeneration: appModel.memoryAccountGeneration) }
        }
        .fullScreenCover(isPresented: $showsFullEditor) {
            if let entry {
                DiningFeedbackSheet(entry: entry) { appModel.updateDiningEntry($0, expected: entry) }
            }
        }
        .fullScreenCover(item: $selectedRestaurant) { restaurant in
            RecordedRestaurantDetailScreen(restaurant: restaurant, entryID: entryID)
        }
        .sheet(isPresented: $showsHistory) { FoodMemoryHistorySheet(entryID: entryID) }
        .sheet(isPresented: $showsLegacySummary) {
            if let entry { FoodMemoryStoredNoteSheet(note: entry.note) }
        }
        .sheet(item: $selectedTaste) { FoodMemoryTasteSheet(taste: $0) }
        .alert("이 기록을 삭제할까요?", isPresented: $showsDelete) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) { appModel.removeDiningEntry(id: entryID) }
        } message: { Text("사진과 기록이 함께 삭제돼요.") }
        .preferredColorScheme(showsOptions ? .dark : statusBarColorScheme)
        // 상태표시줄의 사진 대비와 제품의 시스템 테마를 분리한다.
        .environment(\.colorScheme, systemColorScheme)
    }

    private var optionsSafeAreaTop: CGFloat {
        UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows).first { $0.isKeyWindow }?.safeAreaInsets.top ?? 0
    }

    private var optionsSheetHeight: CGFloat {
        BottomSheetShellMetrics.stageHeight(screenHeight: UIScreen.main.bounds.height,
                                           safeAreaTop: optionsSafeAreaTop)
    }

    private var optionsProgress: CGFloat {
        showsOptions ? 1 - min(max(optionsDragTranslation / max(optionsSheetHeight, 1), 0), 1) : 0
    }

    private func openOptionsSheet() {
        pendingOption = nil
        optionsDragTranslation = 0
        resetOptionsDrag()
        optionsScrollCoordinator.reset()
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
            showsOptions = true
        }
    }

    private func closeOptionsSheet(selecting option: FoodMemoryOption? = nil) {
        guard showsOptions else { return }
        pendingOption = option
        withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion), completionCriteria: .removed) {
            showsOptions = false
            optionsDragTranslation = 0
            resetOptionsDrag()
        } completion: {
            optionsScrollCoordinator.reset()
            presentSelectedOption()
        }
    }

    private var optionsDragGesture: some Gesture {
        DragGesture(minimumDistance: StagedBottomSheetDragMetrics.minimumDistance)
            .onChanged { value in
                let movement = value.translation.height
                guard movement > 0, movement >= abs(value.translation.width) else { return }
                guard optionsScrollCoordinator.allowsSheetDrag else {
                    optionsDragWaitedForScroll = true
                    return
                }
                if !isDraggingOptions {
                    optionsDragBaseline = optionsDragWaitedForScroll ? movement : 0
                    isDraggingOptions = true
                    optionsScrollCoordinator.isSheetDragging = true
                }
                optionsDragTranslation = max(movement - optionsDragBaseline, 0)
            }
            .onEnded { value in
                guard isDraggingOptions else { resetOptionsDrag(); return }
                let movement = max(value.translation.height - optionsDragBaseline,
                                   value.predictedEndTranslation.height - optionsDragBaseline)
                if movement >= optionsSheetHeight * StagedBottomSheetDragMetrics.dismissProgressThreshold {
                    closeOptionsSheet()
                } else {
                    withAnimation(TasteBloomMotion.animation(.sheet, reduceMotion: reduceMotion)) {
                        optionsDragTranslation = 0
                        resetOptionsDrag()
                    }
                }
            }
    }

    private func resetOptionsDrag() {
        isDraggingOptions = false
        optionsDragBaseline = 0
        optionsDragWaitedForScroll = false
        optionsScrollCoordinator.isSheetDragging = false
    }

    private func presentSelectedOption() {
        guard let option = pendingOption else { return }
        pendingOption = nil
        guard entry != nil else { return }
        switch option {
        case .edit: showsFullEditor = true
        case .addPhoto: showsPhotoPicker = true
        case .managePhotos: showsPhotoManager = true
        case .note: showsNoteEditor = true
        case .recordInfo: openFieldEditor(.recordInfo)
        case .legacySummary: showsLegacySummary = true
        case .history: showsHistory = true
        case .delete: showsDelete = true
        }
    }

    private func openFieldEditor(_ kind: FoodMemoryFieldEdit.Kind) {
        guard let entry else { return }
        fieldEdit = .init(kind: kind, original: entry, accountGeneration: appModel.memoryAccountGeneration)
    }

    @MainActor
    private func savePhotos(_ items: [PhotosPickerItem]) async {
        guard let original = entry, !items.isEmpty else { return }
        let accountGeneration = appModel.memoryAccountGeneration
        let ownerScope = DiningReflectionPhotoStore.currentOwnerScope
        var staged: [String] = []
        var committed = false
        var palette = original.photoPalette
        isSavingPhoto = true
        photoError = nil
        defer {
            if !committed { staged.forEach { DiningReflectionPhotoStore.remove(filename: $0, ownerScope: ownerScope) } }
            if photoPickerItems == items { isSavingPhoto = false }
        }
        guard items.count <= max(0, FoodMemoryDetailPresentation.maximumPhotoCount - original.allReflectionPhotoFilenames.count) else {
            photoError = "사진은 10장까지 추가할 수 있어요."
            return
        }
        do {
            for item in items {
                guard let data = try await item.loadTransferable(type: Data.self),
                      let normalized = await DiningReflectionPhotoStore.normalizedJPEGDataInBackground(data) else {
                    if !Task.isCancelled { photoError = "사진을 불러올 수 없어요." }
                    return
                }
                if original.allReflectionPhotoFilenames.isEmpty && staged.isEmpty {
                    palette = await DiningPhotoPalette.extractInBackground(from: normalized)
                }
                guard !Task.isCancelled, accountGeneration == appModel.memoryAccountGeneration else { return }
                guard appModel.diningEntry(id: entryID) == original else {
                    photoError = "기록이 바뀌었어요. 사진을 다시 선택해 주세요."
                    return
                }
                staged.append(try DiningReflectionPhotoStore.save(normalized, entryID: entryID, ownerScope: ownerScope))
            }
            guard !Task.isCancelled, accountGeneration == appModel.memoryAccountGeneration else { return }
            let updated = try FoodMemoryDetailPresentation.settingPhotos(in: original, filenames: original.allReflectionPhotoFilenames + staged, palette: palette)
            committed = appModel.updateDiningEntry(updated, expected: original)
            if !committed { photoError = appModel.diningPersistenceError ?? "사진을 저장하지 못했어요." }
        } catch {
            if !Task.isCancelled, accountGeneration == appModel.memoryAccountGeneration {
                photoError = "사진을 저장하지 못했어요. 다시 시도해 주세요."
            }
        }
    }

    private func removePhoto(_ filename: String, from original: DiningEntry) -> Bool {
        guard original.id == entryID, original.allReflectionPhotoFilenames.contains(filename) else { return false }
        do {
            let filenames = original.allReflectionPhotoFilenames.filter { $0 != filename }
            let palette = original.allReflectionPhotoFilenames.first == filename ? nil : original.photoPalette
            let updated = try FoodMemoryDetailPresentation.settingPhotos(in: original, filenames: filenames, palette: palette)
            return appModel.updateDiningEntry(updated, expected: original)
        } catch {
            return false
        }
    }

    private func recordContent(_ entry: DiningEntry) -> some View {
        let presentation = FoodMemoryDetailPresentation(entry: entry)
        return VStack(alignment: .leading, spacing: 0) {
            FoodMemoryPhotoCarousel(photos: presentation.photos,
                                    topSafeAreaInset: statusBarFrame.height,
                                    scrollCoordinateSpace: photoScrollCoordinateSpace,
                                    onImageChange: { topBarPhoto = $0 }) {
                showsPhotoPicker = true
            }
            .onGeometryChange(for: CGRect.self, of: { geometry in
                var frame = geometry.frame(in: .global)
                let stretch = presentation.photos.isEmpty ? 0
                    : max(0, geometry.frame(in: .named(photoScrollCoordinateSpace)).minY)
                frame.origin.y -= stretch
                frame.size.height += stretch
                return frame
            }) { photoFrame = $0 }
            .disabled(isSavingPhoto)
            .overlay { if isSavingPhoto { ProgressView().padding(16).background(.regularMaterial, in: Circle()) } }

            VStack(alignment: .leading, spacing: TBSpacing.x12) {
                VStack(alignment: .leading, spacing: TBSpacing.x12) {
                    identity(entry, date: presentation.dateLabel)
                    if !presentation.tastes.isEmpty {
                        tasteChips(presentation.tastes)
                    }
                }

                if !presentation.isGeneratedNote, !entry.note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    DiningNotePreview(summary: entry.note, lineLimit: nil, minimumHeight: 52)
                        .textSelection(.enabled)
                }

                if let error = photoError ?? appModel.diningPersistenceError {
                    Callout(message: error, tone: .critical)
                }
            }
            .foregroundStyle(TBColor.textPrimary)
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, TBSpacing.section)
            .padding(.bottom, 36)
        }
    }

    private func tasteChips(_ tastes: [FoodMemoryTaste]) -> some View {
        let sensory = tastes.filter { $0.axis != nil }
        let details = tastes.filter { $0.axis == nil }
        return OverflowTagRow(
            items: sensory + details,
            spacing: DishFeedbackCardMetrics.chipStackGap,
            allowsExpansion: true
        ) { taste in
            Button { selectedTaste = taste } label: {
                if let axis = taste.axis {
                    Chip(
                        title: taste.label,
                        tasteAxis: axis,
                        size: .small
                    )
                } else {
                    NeutralChip(title: taste.label)
                }
            }
            .fixedSize()
            .buttonStyle(TBTokenButtonStyle())
            .accessibilityLabel(taste.accessibilityLabel)
            .accessibilityHint("남긴 응답 보기")
        } overflow: { count in
            Chip(title: "+\(count)", size: .small)
        }
    }

    private func identity(_ entry: DiningEntry, date: String?) -> some View {
        VStack(alignment: .leading, spacing: TBSpacing.x12) {
            HStack(alignment: .top, spacing: TBSpacing.x12) {
                VStack(alignment: .leading, spacing: TBSpacing.x4) {
                    Text(entry.menu.isEmpty ? "음식 기록" : entry.menu)
                        .font(TBFont.bold(18))
                        .fixedSize(horizontal: false, vertical: true)

                    if let restaurant = entry.linkedRestaurantSummary {
                        Button { selectedRestaurant = restaurant } label: {
                            HStack(spacing: 4) {
                                Text(entry.restaurant).font(TBFont.medium(13))
                                LucideIcon(.chevronRight, size: 12, strokeWidth: TBIcon.Stroke.regular)
                            }
                            .foregroundStyle(TBColor.textSubtle)
                            .frame(minHeight: 32, alignment: .leading)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(entry.restaurant), 식당 상세 보기")
                        .accessibilityIdentifier("food-memory-restaurant-detail")
                    } else if !entry.restaurant.isEmpty {
                        Text(entry.restaurant).font(TBFont.medium(13)).foregroundStyle(TBColor.textSubtle)
                    }
                }
                Spacer(minLength: TBSpacing.x8)
                overallEvaluation(entry)
                    .fixedSize()
            }

            dateButton(date)
        }
    }

    @ViewBuilder
    private func dateButton(_ date: String?) -> some View {
        if let date {
            Button { openFieldEditor(.date) } label: {
                Text(date)
                    .font(TBFont.medium(11))
                    .foregroundStyle(TBColor.textMuted)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(date), 날짜 수정")
        }
    }

    @ViewBuilder
    private func overallEvaluation(_ entry: DiningEntry) -> some View {
        let accentColor = FoodMemoryDetailPresentation(entry: entry).tastes
            .compactMap(\.axis).first.map {
                Color.tbAdaptive(light: $0.lightPalette.light, dark: $0.palette(in: .dark).main)
            } ?? TBColor.iconMuted
        let accountGeneration = appModel.memoryAccountGeneration
        if let evaluation = entry.overallEvaluation, evaluation.starRating == nil {
            NeutralChip(title: evaluation.responseLabelSnapshot)
                .accessibilityLabel("전체 평가, \(evaluation.responseLabelSnapshot)")
        } else {
            StarRating(value: entry.overallEvaluation?.starRating ?? 0, color: accentColor) { rating in
                guard accountGeneration == appModel.memoryAccountGeneration else { return }
                var updated = entry
                updated.overallEvaluation = rating == 0 ? nil : DiningOverallEvaluation(starRating: rating)
                appModel.updateDiningEntry(updated, expected: entry)
            }
            .accessibilityIdentifier("food-memory-rating")
        }
    }
}

private enum FoodMemoryOption: String, Identifiable {
    case edit, addPhoto, managePhotos, note, recordInfo, legacySummary, history, delete
    var id: String { rawValue }
    var title: String {
        switch self {
        case .edit: "기록 수정"
        case .addPhoto: "사진 추가"
        case .managePhotos: "사진 관리"
        case .note: "메모 수정"
        case .recordInfo: "기록 정보 수정"
        case .legacySummary: "이전 요약 보기"
        case .history: "수정 이력"
        case .delete: "기록 삭제"
        }
    }
    var icon: String {
        switch self {
        case .edit: "square-pen"
        case .addPhoto: "image-plus"
        case .managePhotos: "photo.on.rectangle"
        case .note: "pencil"
        case .recordInfo: "calendar.fill"
        case .legacySummary: "eye"
        case .history: "clock"
        case .delete: "trash"
        }
    }
    var detail: String {
        switch self {
        case .edit: "음식과 미각, 전체 평가를 다시 정리합니다"
        case .addPhoto: "이 음식 기록에 사진을 추가합니다"
        case .managePhotos: "저장한 사진을 확인하고 삭제합니다"
        case .note: "이 기록에 남긴 메모를 수정합니다"
        case .recordInfo: "식사일과 식당을 수정합니다"
        case .legacySummary: "이전 기록에 저장된 요약을 확인합니다"
        case .history: "이 기록에서 수정한 내용을 확인합니다"
        case .delete: "사진과 음식 기록을 삭제합니다"
        }
    }
}

private struct FoodMemoryOptionsSheet: View {
    let entry: DiningEntry
    let isSavingPhoto: Bool
    let onClose: () -> Void
    let onSelect: (FoodMemoryOption) -> Void

    private var options: [FoodMemoryOption] {
        var options: [FoodMemoryOption] = [.edit, .addPhoto]
        if !entry.allReflectionPhotoFilenames.isEmpty { options.append(.managePhotos) }
        options += [.note, .recordInfo]
        if FoodMemoryDetailPresentation(entry: entry).isGeneratedNote { options.append(.legacySummary) }
        if !(entry.memoryCorrections?.isEmpty ?? true) { options.append(.history) }
        options.append(.delete)
        return options
    }

    var body: some View {
        BottomSheetShell(
            headerStart: AnyView(BottomSheetCloseButton(action: onClose)),
            headerCenter: AnyView(Text("기록 옵션").font(TBFont.bold(15)).foregroundStyle(TBColor.textPrimary)),
            stageMode: .fixed,
            usesNativeSheetChrome: false,
            surfaceBackground: TBColor.page
        ) {
            BottomSheetScrollView {
                VStack(spacing: 10) {
                    ForEach(options) { option in
                        ActionSheetRow(
                            icon: option.icon,
                            title: option.title,
                            detail: option.detail,
                            isDestructive: option == .delete,
                            isDisabled: isDisabled(option)
                        ) {
                            onSelect(option)
                        }
                    }
                    Button(action: onClose) {
                        Text("취소")
                            .font(TBFont.medium(14))
                            .foregroundStyle(TBColor.textMuted)
                            .frame(maxWidth: .infinity, minHeight: 48)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(TBTokenButtonStyle())
                }
                .padding(.horizontal, TBSpacing.page)
                .padding(.top, TBSpacing.x8)
                .padding(.bottom, TBSpacing.page + 24)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("food-memory-options-sheet")
    }

    private func isDisabled(_ option: FoodMemoryOption) -> Bool {
        switch option {
        case .addPhoto: isSavingPhoto || entry.allReflectionPhotoFilenames.count >= FoodMemoryDetailPresentation.maximumPhotoCount
        case .managePhotos: isSavingPhoto
        default: false
        }
    }
}

struct FoodMemoryPhoto: Identifiable, Equatable {
    let entryID: UUID
    let menu: String
    let filename: String
    var id: String { filename }
}

struct FoodMemoryTaste: Identifiable {
    let id: String
    let label: String
    let axis: TasteAxis?
    let selection: DiningSensorySelection?
    var accessibilityLabel: String {
        ([label] + [selection?.liking?.label, selection?.intensity?.label, selection?.preferenceFit?.label].compactMap { $0 }).joined(separator: ", ")
    }
}

/// Reading-only presentation: absent responses stay absent; legacy IDs never become ratings.
struct FoodMemoryDetailPresentation {
    static let maximumPhotoCount = 10
    let photos: [FoodMemoryPhoto]
    let tastes: [FoodMemoryTaste]
    let dateLabel: String?
    let isGeneratedNote: Bool

    static func settingPhotos(in entry: DiningEntry, filenames: [String], palette: DiningPhotoPalette?) throws -> DiningEntry {
        guard filenames.allSatisfy(DiningReflectionPhotoStore.isValidFilename) else { throw DiningReflectionPhotoStore.PhotoError.invalidFilename }
        var seen = Set<String>()
        let ordered = filenames.filter { seen.insert($0).inserted }
        let encoder = JSONEncoder(), decoder = JSONDecoder()
        guard case .object(var fields) = try decoder.decode(DiningSelectionJSON.self, from: encoder.encode(entry)) else {
            throw CocoaError(.coderInvalidValue)
        }
        fields["reflectionPhotoFilename"] = ordered.first.map(DiningSelectionJSON.string)
        fields["additionalPhotoFilenames"] = .array(ordered.dropFirst().map(DiningSelectionJSON.string))
        fields["photoPalette"] = try palette.map { try decoder.decode(DiningSelectionJSON.self, from: encoder.encode($0)) }
        return try decoder.decode(DiningEntry.self, from: encoder.encode(DiningSelectionJSON.object(fields)))
    }

    init(entry: DiningEntry) {
        photos = entry.allReflectionPhotoFilenames.filter(DiningReflectionPhotoStore.isValidFilename).map {
            FoodMemoryPhoto(entryID: entry.id, menu: entry.menu, filename: $0)
        }
        if let selections = entry.sensorySelections {
            tastes = selections.enumerated().map { index, selection in
                FoodMemoryTaste(id: "\(index)-\(selection.stableID)", label: selection.labelSnapshot,
                                axis: selection.type == .bubble ? TasteExperienceCatalog.experienceByID[selection.id]?.axis : nil,
                                selection: selection)
            }
        } else {
            tastes = entry.tasteExperienceIDs.enumerated().compactMap { index, id in
                guard let taste = TasteExperienceCatalog.experienceByID[id] else { return nil }
                return FoodMemoryTaste(id: "bubble-\(index)", label: taste.label, axis: taste.axis, selection: nil)
            } + entry.detailTagIDs.enumerated().compactMap { index, id in
                guard let tag = DiningDetailTagCatalog.metadata(for: id) else { return nil }
                return FoodMemoryTaste(id: "detail-\(index)", label: tag.label, axis: nil, selection: nil)
            }
        }
        isGeneratedNote = entry.note.hasPrefix("메인 미각 ") && entry.note.hasSuffix("으로 기억에 남은 식후 피드백입니다.")
        let format: (Date) -> String = { $0.formatted(.dateTime.year().month().day().locale(Locale(identifier: "ko_KR"))) }
        if let time = entry.mealTime, let start = time.start {
            switch time.source {
            case .confirmed: dateLabel = format(start)
            case .approximate: dateLabel = time.end.map { "\(format(start)) – \(format($0)) 무렵" } ?? "\(format(start)) 무렵"
            case .photoCandidate: dateLabel = "\(format(start)) 촬영"
            default: dateLabel = entry.savedAt.map { "\(format($0)) 기록" }
            }
        } else if let savedAt = entry.savedAt {
            dateLabel = "\(format(savedAt)) 기록"
        } else if entry.mealTime == nil {
            dateLabel = "\(format(entry.date)) 기록"
        } else {
            dateLabel = nil
        }
    }
}

private struct FoodMemoryPhotoCarousel: View {
    let photos: [FoodMemoryPhoto]
    let topSafeAreaInset: CGFloat
    let scrollCoordinateSpace: UUID
    let onImageChange: (CGImage?) -> Void
    let onAddPhoto: () -> Void
    @State private var selection = 0

    var body: some View {
        Group {
            if photos.isEmpty {
                Button(action: onAddPhoto) {
                    VStack(spacing: 10) {
                        LucideIcon(.imagePlus, size: 28, strokeWidth: TBIcon.Stroke.thin)
                            .foregroundStyle(TBColor.iconMuted)
                        Text("사진 추가").font(TBFont.medium(13))
                    }
                    .foregroundStyle(TBColor.textFaint)
                    .padding(.top, topSafeAreaInset)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(TBColor.mutedSurface)
                }
                .buttonStyle(.plain)
            } else {
                GeometryReader { proxy in
                    let stretch = max(0, proxy.frame(in: .named(scrollCoordinateSpace)).minY)
                    TabView(selection: $selection) {
                        ForEach(Array(photos.enumerated()), id: \.element.id) { index, photo in
                            FoodMemoryPhotoPage(photo: photo, size: proxy.size, stretchHeight: stretch,
                                                isSelected: index == selection,
                                                onImageChange: onImageChange)
                                .tag(index)
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                    .frame(width: proxy.size.width, height: proxy.size.height + stretch)
                    .clipped()
                    .overlay(alignment: .bottom) {
                        HStack(alignment: .bottom) {
                            Spacer(minLength: 12)
                            if photos.count > 1 {
                                Text("\(selection + 1) / \(photos.count)")
                                    .monospacedDigit()
                                    .padding(.horizontal, 10).padding(.vertical, 7)
                                    .background(.black.opacity(0.55), in: Capsule())
                            }
                        }
                        .font(TBFont.medium(11)).foregroundStyle(.white)
                        .padding(16)
                        .allowsHitTesting(false)
                    }
                    .offset(y: -stretch)
                }
                .onChange(of: photos) { _, _ in
                    selection = 0
                    if photos.isEmpty { onImageChange(nil) }
                }
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("food-memory-photos")
            }
        }
        .aspectRatio(4.0 / 5.0, contentMode: .fit)
    }
}

private struct FoodMemoryPhotoPage: View {
    @Environment(\.displayScale) private var scale
    let photo: FoodMemoryPhoto
    let size: CGSize
    var stretchHeight: CGFloat = 0
    var isSelected = true
    var onImageChange: ((CGImage?) -> Void)? = nil
    @State private var image: CGImage?
    @State private var loadedFilename: String?
    @State private var finished = false
    @State private var photoRevision = 0

    var body: some View {
        Group {
            if loadedFilename == photo.filename, let image {
                Image(decorative: image, scale: scale, orientation: .up)
                    .resizable().scaledToFill()
            } else if finished {
                VStack(spacing: 8) {
                    LucideIcon(.image, size: 24, strokeWidth: TBIcon.Stroke.regular)
                    Text("사진을 불러올 수 없어요").font(TBFont.regular(12))
                }
                .foregroundStyle(TBColor.textSecondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(width: size.width, height: size.height + stretchHeight)
        .background(TBColor.mutedSurface)
        .clipped()
        .accessibilityLabel("\(photo.menu) 사진")
        .onReceive(NotificationCenter.default.publisher(for: DiningReflectionPhotoStore.didChangeNotification)) { _ in photoRevision &+= 1 }
        .task(id: "\(photo.filename)-\(photoRevision)-\(Int(size.width * scale))-\(isSelected)") {
            if isSelected { onImageChange?(nil) }
            image = nil
            finished = false
            loadedFilename = photo.filename
            let thumbnail = await DiningReflectionPhotoStore.thumbnail(for: photo.filename, fillingSquareOf: max(1, Int(size.width * scale)))
            guard !Task.isCancelled else { return }
            image = thumbnail
            finished = true
            if isSelected { onImageChange?(thumbnail) }
        }
        .onDisappear { image = nil; loadedFilename = nil; finished = false }
    }
}

private struct FoodMemoryPhotoManager: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let entryID: UUID
    @Binding var pickerItems: [PhotosPickerItem]
    @Binding var isSaving: Bool
    @Binding var importError: String?
    let onRemove: (String, DiningEntry) -> Bool
    @State private var showsPicker = false
    @State private var pendingPhoto: FoodMemoryPhoto?
    @State private var showsPhotoDelete = false
    @State private var pendingEntry: DiningEntry?
    @State private var pendingAccountGeneration: UUID?
    private var entry: DiningEntry? { appModel.diningEntry(id: entryID) }

    var body: some View {
        VStack(spacing: 0) {
            TopAppBar(appearance: .solid, title: "사진", showBack: true, showsDefaultActions: false, onBack: { dismiss() })
            ScrollView {
                VStack(spacing: 20) {
                    if let entry {
                        let photos = FoodMemoryDetailPresentation(entry: entry).photos
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(Array(photos.enumerated()), id: \.element.id) { index, photo in
                                photoTile(photo, index: index, entry: entry)
                            }
                        }
                        if photos.count < FoodMemoryDetailPresentation.maximumPhotoCount {
                            Button {
                                pickerItems = []
                                showsPicker = true
                            } label: {
                                HStack(spacing: 8) {
                                    LucideIcon(.plus, size: 18, strokeWidth: TBIcon.Stroke.regular)
                                    Text("사진 추가").font(TBFont.semibold(14))
                                }
                                .frame(maxWidth: .infinity, minHeight: 48)
                                .background(TBColor.mutedSurface, in: Capsule())
                            }
                            .buttonStyle(TBTokenButtonStyle())
                            .disabled(isSaving)
                        }
                    }
                    if isSaving { ProgressView() }
                    if let importError { Callout(message: importError, tone: .critical) }
                }.padding(TBSpacing.page)
            }
        }
        .foregroundStyle(TBColor.textPrimary)
        .tbScreenTopChrome()
        .tbPageBackground()
        .presentationDragIndicator(.visible)
        .photosPicker(isPresented: $showsPicker, selection: $pickerItems,
                      maxSelectionCount: max(1, FoodMemoryDetailPresentation.maximumPhotoCount - (entry?.allReflectionPhotoFilenames.count ?? 0)),
                      selectionBehavior: .ordered, matching: .images)
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
        .alert("이 사진을 삭제할까요?", isPresented: $showsPhotoDelete) {
            Button("취소", role: .cancel) { pendingPhoto = nil }
            Button("삭제", role: .destructive) {
                if pendingAccountGeneration == appModel.memoryAccountGeneration,
                   let photo = pendingPhoto, let original = pendingEntry {
                    importError = nil
                    if !onRemove(photo.filename, original) {
                        importError = appModel.diningPersistenceError ?? "기록이 바뀌었어요. 다시 확인해 주세요."
                    }
                }
                pendingPhoto = nil
                pendingEntry = nil
            }
        }
    }

    private func photoTile(_ photo: FoodMemoryPhoto, index: Int, entry: DiningEntry) -> some View {
        GeometryReader { proxy in
            FoodMemoryPhotoPage(photo: photo, size: proxy.size)
        }
        .aspectRatio(1, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(alignment: .topTrailing) {
            Button {
                pendingEntry = entry
                pendingAccountGeneration = appModel.memoryAccountGeneration
                pendingPhoto = photo
                showsPhotoDelete = true
            } label: {
                LucideIcon(.x, size: 16, strokeWidth: TBIcon.Stroke.regular)
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(.black.opacity(0.5), in: Circle())
            }
            .padding(6)
            .buttonStyle(.plain)
            .disabled(isSaving)
            .accessibilityLabel("사진 \(index + 1) 삭제")
        }
        .overlay(alignment: .bottomLeading) {
            if index == 0 {
                Text("대표 사진")
                    .font(TBFont.medium(10)).foregroundStyle(.white)
                    .padding(.horizontal, 10).padding(.vertical, 6)
                    .background(.black.opacity(0.5), in: Capsule())
                    .padding(8)
            }
        }
    }
}

private struct FoodMemoryTasteSheet: View {
    @Environment(\.dismiss) private var dismiss
    let taste: FoodMemoryTaste
    var body: some View {
        VStack(spacing: 0) {
            TopAppBar(appearance: .solid, title: "남긴 맛", showBack: true, showsDefaultActions: false, onBack: { dismiss() })
            VStack(alignment: .leading, spacing: 20) {
                Text(taste.label).font(TBFont.bold(22))
                if let selection = taste.selection {
                    VStack(spacing: 16) {
                        response("호감", selection.liking?.label)
                        response("강도", selection.intensity?.label)
                        response("알맞음", selection.preferenceFit?.label)
                        response("대상", selection.target == .unspecified ? nil : selection.target.label)
                        response("시점", selection.phase == .unspecified ? nil : selection.phase.label)
                        response("함께 남긴 맛", selection.relatedBubbleLabelSnapshot)
                    }
                }
            }
            .padding(TBSpacing.page)
            .frame(maxWidth: .infinity, alignment: .leading)
            Spacer(minLength: 0)
        }
        .foregroundStyle(TBColor.textPrimary)
        .tbPageBackground()
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
    @ViewBuilder private func response(_ title: String, _ value: String?) -> some View {
        if let value {
            HStack(alignment: .top) {
                Text(title).foregroundStyle(TBColor.textSecondary)
                Spacer(minLength: 20)
                Text(value).multilineTextAlignment(.trailing)
            }.font(TBFont.regular(14))
        }
    }
}

private struct FoodMemoryStoredNoteSheet: View {
    @Environment(\.dismiss) private var dismiss
    let note: String
    var body: some View {
        VStack(spacing: 0) {
            TopAppBar(appearance: .solid, title: "이전 요약", showBack: true, showsDefaultActions: false, onBack: { dismiss() })
            ScrollView {
                Text(note).font(TBFont.regular(15)).lineSpacing(5).textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading).padding(TBSpacing.page)
            }
        }
        .foregroundStyle(TBColor.textPrimary)
        .tbScreenTopChrome()
        .tbPageBackground()
        .presentationDragIndicator(.visible)
    }
}

private struct FoodMemoryHistorySheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let entryID: UUID
    @State private var actionMessage: String?
    var body: some View {
        VStack(spacing: 0) {
            TopAppBar(appearance: .solid, title: "수정 이력", showBack: true, showsDefaultActions: false, onBack: { dismiss() })
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let entry = appModel.diningEntry(id: entryID) {
                        ForEach((entry.memoryCorrections ?? []).reversed()) { correction in
                            VStack(alignment: .leading, spacing: 10) {
                                Text(correction.changedAt.formatted(date: .abbreviated, time: .shortened))
                                    .font(TBFont.medium(12)).foregroundStyle(TBColor.textSecondary)
                                Text(correction.scopeLabel).font(TBFont.semibold(15))
                                if case .string(let before) = correction.before["note"] { Text("이전: \(before)") }
                                if case .string(let after) = correction.after["note"] { Text("변경: \(after)") }
                            }
                            .font(TBFont.regular(14))
                            Divider()
                        }
                        if let latest = entry.memoryCorrections?.last, !latest.before.isEmpty {
                            Button("이전 수정 되돌리기") {
                                actionMessage = appModel.undoMemoryCorrection(entryID: entryID) ? "수정을 되돌렸어요." : "다시 시도해 주세요."
                            }
                            .font(TBFont.semibold(14)).frame(minHeight: 44)
                        }
                    }
                    if let actionMessage { Text(actionMessage).font(TBFont.regular(13)) }
                }.padding(TBSpacing.page)
            }
        }
        .foregroundStyle(TBColor.textPrimary)
        .tbScreenTopChrome()
        .tbPageBackground()
        .presentationDragIndicator(.visible)
    }
}

/// 값으로 전달된 이전 인사이트 시트는 원본 변경·계정 전환 뒤 현재 해석처럼 남지 않는다.
struct MemoryRevisionDismissal: ViewModifier {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.tasteDetailChrome) private var detailChrome
    func body(content: Content) -> some View {
        content.onChange(of: appModel.memoryGeneration) { _, _ in
            if let detailChrome { detailChrome.onBack() }
            else { dismiss() }
        }
    }
}

struct FoodMemoryComparisonView: View {
    enum Scope { case query(String), related(UUID), relatedEntries([UUID]), entries([UUID]), all }
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let scope: Scope
    @State private var selected: UUID?
    @State private var displayLimit = 40
    @State private var comparison: FoodMemoryComparison?
    @State private var comparisonKey = ""
    private var requestKey: String { appModel.foodMemoryIndex.generation.uuidString + "|" + String(appModel.foodMemoryIndex.analysisReady) + "|" + String(reflecting: scope) }
    private nonisolated static func compare(index: FoodMemoryIndex, scope: Scope) -> FoodMemoryComparison {
        let ids: Set<UUID>
        switch scope {
        case .query(let query): ids = Set(index.search(query).candidates.map(\.id))
        case .related(let id): ids = Set(index.related(to: id))
        case .relatedEntries(let entries):
            let roots = Set(entries), allIDs = Set(index.documents.map(\.id))
            ids = roots.isSuperset(of: allIDs) ? allIDs : roots.union(entries.flatMap { index.related(to: $0) })
        case .entries(let entries): ids = Set(entries)
        case .all: ids = Set(index.documents.map(\.id))
        }
        return .init(documents: index.documents.filter { ids.contains($0.id) })
    }
    private var scopeDescription: String {
        switch scope {
        case .query: "검색어에 맞는 전체 후보를 비교해요. 평가 필터로 숨긴 반례·미확인 기록도 포함해요."
        case .related, .relatedEntries: "연결된 원본과 메뉴 ID·이름 또는 저장한 선택이 겹치는 기록을 비교해요. 같은 레시피로 확정하지 않아요."
        case .entries: "선택한 원본 기록을 비교해요. 현재 계정에 없는 기록은 포함하지 않아요."
        case .all: "현재 계정에 이 기기로 저장한 전체 기록을 비교해요."
        }
    }
    var body: some View {
        NavigationStack {
            ScrollView {
                if let value = comparison, comparisonKey == requestKey {
                LazyVStack(alignment: .leading, spacing: TBSpacing.x16) {
                    Text(scopeDescription).font(TBFont.regular(13))
                    if !appModel.foodMemoryIndex.analysisReady {
                        Text(appModel.sensoryAnalysisError ?? "평가 해석을 갱신 중이에요. 현재 원문부터 비교할 수 있어요.")
                    }
                    Text("기록 \(value.documents.count)개 · 서로 다른 식사 \(value.mealCount)회 · 전체 호감 미확인 \(value.unconfirmedCount)개")
                        .font(TBFont.semibold(15))
                    Text("공통 선택: \(value.sharedSelections.isEmpty ? "공통으로 확인된 선택 없음" : value.sharedSelections.joined(separator: " · "))")
                    Text("공통으로 보고한 감각: \(value.sharedAttributes.isEmpty ? "이 범위 전체에서 공통으로 확인되지 않음" : value.sharedAttributes.joined(separator: " · "))")
                    Text("음식 전체가 좋았던 \(value.wholePositiveCount)개에 공통으로 기록된 감각: \(value.positiveSharedAttributes.isEmpty ? "확인되지 않음" : value.positiveSharedAttributes.joined(separator: " · ")) · 좋아한 원인으로 단정하지 않아요.")
                    Text("서로 다른 반응: \(value.opposedAttributes.isEmpty ? "확인된 상반 반응 없음 · 동일 취향을 뜻하지 않아요" : value.opposedAttributes.joined(separator: " · "))")
                    ForEach(value.limits, id: \.self) { Text($0).font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary) }
                    Text("시간에 따른 기록 · 현재 원문 기준").font(TBFont.semibold(16))
                    Text("아래 날짜는 각 기록의 출처를 따릅니다. 음식·표현 구성과 직접 평가를 비교할 수 있지만 안정적인 취향 변화와 원인은 보류해요.").font(TBFont.regular(13))
                    ForEach(Array(value.documents.prefix(displayLimit))) { doc in
                        Button { selected = doc.id } label: { FoodMemoryRow(document: doc, showsConditions: true) }.buttonStyle(.plain)
                    }
                    if value.documents.count > displayLimit { Button("다음 경험 보기") { displayLimit += 40 } }
                    if value.documents.isEmpty { Text("현재 범위에 비교할 기록이 없어요.") }
                }.font(TBFont.regular(14)).foregroundStyle(TBColor.textPrimary).tbPageContentPadding()
                } else { ProgressView("현재 원문을 비교하는 중") }
            }.tbPageBackground().navigationTitle("경험 비교").tbInlineNavigationTitle()
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } } }
        }.sheet(isPresented: Binding(get: { selected != nil }, set: { if !$0 { selected = nil } })) {
            if let selected { FoodMemoryDetailView(entryID: selected) }
        }
        .task(id: requestKey) {
            let key = requestKey, index = appModel.foodMemoryIndex, selectedScope = scope
            let worker = Task.detached(priority: .userInitiated) { Self.compare(index: index, scope: selectedScope) }
            let value = await withTaskCancellationHandler { await worker.value } onCancel: { worker.cancel() }
            guard !Task.isCancelled, key == requestKey else { return }
            comparison = value; comparisonKey = key; displayLimit = 40
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
    }
}

private struct DiningContextSelectionRow: View {
    let title: String
    let value: String
    var detail: String? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: TBSpacing.x12) {
                VStack(alignment: .leading, spacing: TBSpacing.x6) {
                    Text(title).font(TBFont.medium(12)).foregroundStyle(TBColor.textSecondary)
                    Text(value).font(TBFont.semibold(16)).foregroundStyle(TBColor.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                    if let detail {
                        Text(detail).font(TBFont.regular(11)).foregroundStyle(TBColor.textSubtle)
                    }
                }
                Spacer(minLength: TBSpacing.x12)
                LucideIcon(.chevronRight, size: TBIcon.Size.small, strokeWidth: TBIcon.Stroke.regular)
                    .foregroundStyle(TBColor.textSecondary)
            }
            .frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityValue([value, detail].compactMap { $0 }.joined(separator: ", "))
    }
}

struct DiningMealTimeEditor: View {
    @Binding var value: DiningMealTime?
    var suggestedDate: Date = .now
    @State private var showsPicker = false

    private func dateLabel(_ date: Date) -> String {
        date.formatted(.dateTime.year().month().day().locale(Locale(identifier: "ko_KR")))
    }
    private var selectedDateLabel: String {
        guard let value else { return "날짜 선택" }
        if value.source == .approximate, let start = value.start, let end = value.end {
            return "\(dateLabel(start)) – \(dateLabel(end))"
        }
        if [.confirmed, .photoCandidate].contains(value.source), let date = value.start {
            return dateLabel(date)
        }
        return "날짜 선택"
    }
    private var dateDetail: String? {
        guard let value else { return nil }
        if value.source == .photoCandidate { return "사진 날짜 · 식사일 확인 필요" }
        if value.source == .approximate { return "대략적인 식사 기간" }
        return nil
    }

    var body: some View {
        DiningContextSelectionRow(title: "식사일", value: selectedDateLabel, detail: dateDetail) {
            showsPicker = true
        }
        .accessibilityIdentifier("dining-meal-date-card")
        .sheet(isPresented: $showsPicker) {
            DiningMealDatePicker(initialValue: value, suggestedDate: suggestedDate) { selected in
                value = selected
                return true
            }
        }
    }
}

struct DiningMealDatePicker: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let initialValue: DiningMealTime?
    var saveError: String?
    let onSelect: (DiningMealTime?) -> Bool
    @State private var selectedDate: Date

    init(initialValue: DiningMealTime?, suggestedDate: Date, saveError: String? = nil,
         onSelect: @escaping (DiningMealTime?) -> Bool) {
        self.initialValue = initialValue
        self.saveError = saveError
        self.onSelect = onSelect
        _selectedDate = State(initialValue: initialValue?.start ?? suggestedDate)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: TBSpacing.x12) {
                if let saveError { Callout(message: saveError, title: "저장하지 못했어요", tone: .critical) }
                DatePicker("식사일", selection: $selectedDate, displayedComponents: .date)
                    .datePickerStyle(.wheel)
                    .labelsHidden()
                    .environment(\.locale, Locale(identifier: "ko_KR"))
                    .accessibilityIdentifier("dining-meal-date-wheel")
                Button("날짜 모름") {
                    if onSelect(.init(source: .unknown, confirmedAt: .now)) { dismiss() }
                }
                .font(TBFont.medium(14))
                .foregroundStyle(TBColor.textSecondary)
                .frame(minHeight: 44)
            }
            .padding(.horizontal, TBSpacing.page)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .tbPageBackground(TBColor.focus)
            .navigationTitle("식사일 선택")
            .tbInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("적용") {
                        let selected: DiningMealTime? = initialValue?.source == .confirmed && initialValue?.start == selectedDate
                            ? initialValue : .init(source: .confirmed, start: selectedDate, confirmedAt: .now)
                        if onSelect(selected) { dismiss() }
                    }
                }
            }
        }
        .presentationDetents(dynamicTypeSize.isAccessibilitySize ? [.large] : [.height(saveError == nil ? 390 : 480)])
        .presentationDragIndicator(.visible)
        .presentationBackground(TBColor.focus)
    }
}

/// Compact entry card; the existing account-scoped restaurant search lives in its own sheet.
struct DiningRestaurantLinkEditor: View {
    @Binding var context: DiningRecordContext
    @State private var showsSearch = false

    var body: some View {
        DiningContextSelectionRow(title: "식당 연결", value: context.restaurant.isEmpty ? "식당 선택" : context.restaurant) {
            showsSearch = true
        }
        .accessibilityIdentifier("dining-restaurant-card")
        .sheet(isPresented: $showsSearch) {
            DiningRestaurantSelectionSheet(initialContext: context) { selected in
                context = selected
                return true
            }
        }
    }
}

/// Reuses account records and the existing Kakao client. Names alone never select an identity.
struct DiningRestaurantSelectionSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let initialContext: DiningRecordContext
    var saveError: String?
    let onSelect: (DiningRecordContext) -> Bool
    @State private var query: String
    @State private var places: [KakaoRestaurantPlace] = []
    @State private var isSearching = false
    @State private var searchError: String?
    @State private var retry = 0
    @FocusState private var queryIsFocused: Bool

    init(initialContext: DiningRecordContext, saveError: String? = nil,
         onSelect: @escaping (DiningRecordContext) -> Bool) {
        self.initialContext = initialContext
        self.saveError = saveError
        self.onSelect = onSelect
        _query = State(initialValue: initialContext.restaurant)
    }

    private var previousRestaurants: [DiningEntry] {
        var seen = Set<String>()
        let term = query.trimmingCharacters(in: .whitespacesAndNewlines)
        return appModel.diningEntries.filter { entry in
            guard let id = entry.restaurantID, !id.isEmpty, entry.foodSource?.kind != "homeCooked",
                  term.isEmpty || entry.restaurant.localizedCaseInsensitiveContains(term) else { return false }
            return seen.insert((entry.foodSource?.restaurantNamespace ?? "tastebuddy.restaurant") + ":" + id).inserted
        }
    }

    private func select(name: String, id: String, namespace: String? = nil, place: DiningRestaurantPlaceReference? = nil) {
        var context = initialContext
        context.selectRestaurant(name: name, id: id, namespace: namespace, place: place)
        if onSelect(context) { queryIsFocused = false; dismiss() }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.x12) {
                    if let saveError { Callout(message: saveError, title: "저장하지 못했어요", tone: .critical) }
                    TBTextInput(text: $query, placeholder: "식당 이름과 지점 검색", accessibilityName: "연결할 식당 검색", focus: $queryIsFocused)
                    ForEach(previousRestaurants) { entry in
                        TBSelectionCard(title: entry.restaurant, description: "내 기록에 연결한 식당", indicator: .radio,
                                        isSelected: entry.restaurantID == initialContext.restaurantID, showsUnselectedBorder: false) {
                            if let id = entry.restaurantID {
                                select(name: entry.restaurant, id: id, namespace: entry.foodSource?.restaurantNamespace, place: entry.foodSource?.restaurantPlace)
                            }
                        }
                    }
                    if isSearching { ProgressView("지도에서 식당 찾는 중") }
                    if let searchError {
                        Text(searchError).font(TBFont.regular(12)).foregroundStyle(TBColor.textSubtle)
                        Button("다시 찾기") { retry += 1 }
                    } else if !isSearching && places.isEmpty && !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Text("일치하는 지도 장소가 없어요. 지점이나 동네를 함께 입력해 주세요.")
                            .font(TBFont.regular(12)).foregroundStyle(TBColor.textSubtle)
                    }
                    ForEach(places) { place in
                        if let placeID = place.placeID {
                            TBSelectionCard(title: place.name, description: place.displayAddress ?? "주소 미확인", indicator: .radio,
                                            isSelected: initialContext.restaurantID == "kakao-\(placeID)", showsUnselectedBorder: false) {
                                select(name: place.name, id: "kakao-\(placeID)", place: place.recordReference)
                            }
                        }
                    }
                    if !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Button("지도에 없는 새 식당으로 연결") {
                            select(name: query.trimmingCharacters(in: .whitespacesAndNewlines), id: "local-\(UUID().uuidString)")
                        }.font(TBFont.medium(13)).frame(minHeight: 44)
                        Text("같은 식당의 기록을 모으려면 기존에 연결한 식당을 선택해 주세요.")
                            .font(TBFont.regular(12)).foregroundStyle(TBColor.textSubtle)
                    }
                }
                .tbPageContentPadding()
            }
            .scrollDismissesKeyboard(.interactively)
            .foregroundStyle(TBColor.textPrimary)
            .tbPageBackground()
            .navigationTitle("식당 선택").tbInlineNavigationTitle()
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("취소") { dismiss() } } }
            .task(id: "\(query)-\(retry)") {
                let term = query.trimmingCharacters(in: .whitespacesAndNewlines)
                places = []; searchError = nil
                guard !term.isEmpty else { isSearching = false; return }
                isSearching = true
                let generation = appModel.memoryAccountGeneration
                do {
                    try await Task.sleep(for: .milliseconds(350))
                    guard !Task.isCancelled, generation == appModel.memoryAccountGeneration else { return }
                    let client = RestaurantPlaceAPIClient()
                    guard client.configuration.kakaoRestAPIKey != nil else {
                        searchError = "지도 검색을 사용할 수 없어요. 기존 식당을 선택하거나 직접 연결해 주세요."
                        isSearching = false; return
                    }
                    let result = try await client.searchKakaoRestaurantPlaces(query: term, size: 5)
                    guard !Task.isCancelled, generation == appModel.memoryAccountGeneration else { return }
                    places = result; isSearching = false
                } catch {
                    guard !Task.isCancelled, generation == appModel.memoryAccountGeneration else { return }
                    searchError = "식당을 불러오지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요."
                    isSearching = false
                }
            }
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
    }
}

/// Shared fields for creating a record and editing the metadata of an existing one.
private struct DiningRecordContextFields: View {
    @Binding var context: DiningRecordContext
    let suggestedDate: Date

    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.page) {
            SectionCard {
                DiningMealTimeEditor(value: $context.mealTime, suggestedDate: suggestedDate)
            }
            if context.foodSource?.kind != "homeCooked" {
                SectionCard {
                    DiningRestaurantLinkEditor(context: $context)
                }
            }
        }
    }
}

struct DiningRecordContextSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var context: DiningRecordContext
    @State private var allowsUnknown = false
    let suggestedDate: Date
    let onConfirm: (DiningRecordContext) -> Void

    init(context: DiningRecordContext, suggestedDate: Date, onConfirm: @escaping (DiningRecordContext) -> Void) {
        _context = State(initialValue: context)
        self.suggestedDate = suggestedDate
        self.onConfirm = onConfirm
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text(context.foodSource?.kind == "homeCooked" ? "언제 먹은 요리인가요?" : "언제, 어느 식당에서 먹었나요?").font(TBFont.bold(20))
                    DiningRecordContextFields(context: $context, suggestedDate: suggestedDate)
                    if !context.hasConfirmedContext {
                        Toggle("모르는 정보는 나중에 보완", isOn: $allowsUnknown).font(TBFont.medium(14))
                        Text("미확인 날짜와 식당은 기간별·식당별 그래프에서 제외돼요.")
                            .font(TBFont.regular(12)).foregroundStyle(TBColor.textSubtle)
                    }
                }.tbPageContentPadding()
            }
            .scrollDismissesKeyboard(.interactively)
            .tbPageBackground()
            .navigationTitle("기록 정보 확인").tbInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("저장") {
                        if context.mealTime == nil || context.mealTime?.source == .recordedOnly {
                            context.mealTime = .init(source: .unknown)
                        }
                        onConfirm(context)
                        dismiss()
                    }.disabled(!context.hasConfirmedContext && !allowsUnknown)
                }
            }
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
    }
}

/// Local editing state only. No source fields are mutated until the existing save succeeds.
struct FoodMemoryCorrectionDraft: Equatable {
    /// Retained with the draft for the lifetime of one editing presentation.
    /// A parent refresh must not silently advance the optimistic-lock baseline.
    let original: DiningEntry
    var note: String
    var mealTime: DiningMealTime?
    var foodSource: DiningFoodSource?
    var restaurant: String
    var restaurantID: String?

    var recordContext: DiningRecordContext {
        get { .init(restaurant: restaurant, restaurantID: restaurantID, mealTime: mealTime, foodSource: foodSource) }
        set { restaurant = newValue.restaurant; restaurantID = newValue.restaurantID; mealTime = newValue.mealTime; foodSource = newValue.foodSource }
    }

    init(_ original: DiningEntry) {
        self.original = original
        note = original.note
        mealTime = original.mealTime
        foodSource = original.foodSource
        restaurant = original.restaurant
        restaurantID = original.restaurantID
    }

    func hasChanges(comparedTo original: DiningEntry) -> Bool {
        self != FoodMemoryCorrectionDraft(original)
    }

    func updating(_ original: DiningEntry) -> DiningEntry {
        var edited = recordContext.applying(to: original)
        edited.note = note
        edited.mealTime = mealTime
        edited.foodSource = foodSource
        if let date = mealTime?.confirmedDate {
            edited.date = date
            edited.observedAt = date
        }
        return edited
    }
}

private struct FoodMemoryNoteEditor: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var original: DiningEntry
    @State private var accountGeneration: UUID
    @State private var note: String
    @State private var showsDiscardConfirmation = false
    @State private var saveError: String?

    init(original: DiningEntry, accountGeneration: UUID) {
        _original = State(initialValue: original)
        _accountGeneration = State(initialValue: accountGeneration)
        _note = State(initialValue: original.note)
    }

    private var hasChanges: Bool { note != original.note }

    var body: some View {
        DiningReflectionNoteView(
            note: $note,
            title: original.menu.isEmpty ? "메뉴 미기록" : original.menu,
            actionLabel: "저장하기",
            isSaveEnabled: hasChanges,
            helperText: "수정한 메모를 이 기록에 저장해요.",
            saveError: saveError,
            onCancel: cancel,
            onSave: save
        )
        .tbScreenTopChrome()
        .edgeSwipeBack(action: cancel)
        .accessibilityAction(.escape, cancel)
        .interactiveDismissDisabled(hasChanges)
        .alert("변경 내용을 버릴까요?", isPresented: $showsDiscardConfirmation) {
            Button("계속 수정", role: .cancel) {}
            Button("변경 내용 버리기", role: .destructive) { dismiss() }
        } message: {
            Text("저장하지 않은 수정만 사라져요. 기존 기록은 유지돼요.")
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
    }

    private func cancel() {
        if hasChanges { showsDiscardConfirmation = true }
        else { dismiss() }
    }

    private func save() {
        guard accountGeneration == appModel.memoryAccountGeneration else { dismiss(); return }
        guard hasChanges else { return }
        // Only the note changes. Dates, source metadata, selections, photos and IDs stay intact.
        var edited = original
        edited.note = note
        saveError = nil
        if appModel.updateDiningEntry(edited, expected: original) {
            dismiss()
        } else {
            saveError = appModel.diningPersistenceError ?? "기록을 저장하지 못했어요. 다시 시도해 주세요."
        }
    }
}

private struct FoodMemoryFieldEdit: Identifiable {
    enum Kind { case date, recordInfo }
    let id = UUID()
    let kind: Kind
    let original: DiningEntry
    let accountGeneration: UUID
}

private struct FoodMemoryFieldEditor: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let edit: FoodMemoryFieldEdit
    @State private var saveError: String?
    @State private var context: DiningRecordContext
    @State private var showsDiscardConfirmation = false

    init(edit: FoodMemoryFieldEdit) {
        self.edit = edit
        _context = State(initialValue: .init(
            restaurant: edit.original.restaurant, restaurantID: edit.original.restaurantID,
            mealTime: edit.original.mealTime, foodSource: edit.original.foodSource
        ))
    }

    private var hasChanges: Bool {
        context != DiningRecordContext(
            restaurant: edit.original.restaurant, restaurantID: edit.original.restaurantID,
            mealTime: edit.original.mealTime, foodSource: edit.original.foodSource
        )
    }

    var body: some View {
        Group {
            switch edit.kind {
            case .date:
                DiningMealDatePicker(initialValue: edit.original.mealTime, suggestedDate: edit.original.observedAt,
                                     saveError: saveError) { value in
                    save(DiningRecordFieldUpdate.mealTime(value, in: edit.original))
                }
            case .recordInfo:
                NavigationStack {
                    ScrollView {
                        VStack(spacing: TBSpacing.x16) {
                            if let saveError { Callout(message: saveError, title: "저장하지 못했어요", tone: .critical) }
                            DiningRecordContextFields(context: $context, suggestedDate: edit.original.observedAt)
                        }.tbPageContentPadding()
                    }
                    .tbPageBackground()
                    .navigationTitle("기록 정보 수정").tbInlineNavigationTitle()
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) { Button("취소", action: cancel) }
                        ToolbarItem(placement: .confirmationAction) {
                            Button("저장") {
                                if save(DiningRecordFieldUpdate.recordInfo(context, in: edit.original)) { dismiss() }
                            }.disabled(!hasChanges)
                        }
                    }
                }
            }
        }
        .interactiveDismissDisabled(edit.kind == .recordInfo && hasChanges)
        .alert("변경 내용을 버릴까요?", isPresented: $showsDiscardConfirmation) {
            Button("계속 수정", role: .cancel) {}
            Button("변경 내용 버리기", role: .destructive) { dismiss() }
        } message: {
            Text("저장하지 않은 기록 정보만 사라져요. 기존 기록은 유지돼요.")
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
    }

    private func cancel() {
        if hasChanges { showsDiscardConfirmation = true }
        else { dismiss() }
    }

    private func save(_ updated: DiningEntry) -> Bool {
        guard edit.accountGeneration == appModel.memoryAccountGeneration else { dismiss(); return false }
        saveError = nil
        if appModel.updateDiningEntry(updated, expected: edit.original) { return true }
        saveError = appModel.diningPersistenceError ?? "기록을 저장하지 못했어요. 다시 시도해 주세요."
        return false
    }
}

#if DEBUG || targetEnvironment(simulator)
struct FoodMemoryRuntimePreview: View {
    @StateObject private var model: AppModel
    init() {
        let bundle = Bundle.main
        let url = bundle.url(forResource: "longitudinal-food-memory", withExtension: "json", subdirectory: "Fixtures") ?? bundle.url(forResource: "longitudinal-food-memory", withExtension: "json")
        let entries = url.flatMap { try? Data(contentsOf: $0) }.flatMap { try? JSONDecoder().decode([DiningEntry].self, from: $0) } ?? []
        _model = StateObject(wrappedValue: AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: entries, authRepository: FixtureBackendAuthRepository()))
    }
    var body: some View {
        VStack(spacing: 0) {
            Text("합성 원문 R1–R9 · 검증 전용").font(TBFont.medium(12)).padding(8)
            HomeSearchSheet(initialQuery: "파스타")
        }.environmentObject(model)
    }
}

/// Isolated preview records. Optional local images are supplied only by the QA launch environment.
struct FoodMemoryDetailRuntimePreview: View {
    @StateObject private var model: AppModel
    @State private var showsDetail = true
    private static let mainID = UUID(uuidString: "AB41DDA0-8252-442B-B754-114A37F8BC31")!

    init() {
        let model = AppModel.preview(authEntryComplete: true, onboardingComplete: true, profile: .sample,
                                     authRepository: FixtureBackendAuthRepository())
        let empty = ProcessInfo.processInfo.arguments.contains("--food-memory-detail-empty-qa")
        let contextQA = ProcessInfo.processInfo.arguments.contains("--food-memory-context-qa")
        let directory = ProcessInfo.processInfo.environment["TB_FOOD_MEMORY_PREVIEW_PHOTOS"]
        let singlePhoto = ProcessInfo.processInfo.environment["TB_FOOD_MEMORY_PREVIEW_PHOTO"]
            .flatMap { try? Data(contentsOf: URL(fileURLWithPath: $0)) }
        let files = singlePhoto == nil ? ["first-photo.png", "second-photo.png"] : ["butter-pasta.png"]
        var filenames: [String?] = []
        for (index, file) in files.enumerated() {
            if empty { filenames.append(nil); continue }
            let supplied = singlePhoto
                ?? directory.flatMap { try? Data(contentsOf: URL(fileURLWithPath: $0).appendingPathComponent(file)) }
            let format = UIGraphicsImageRendererFormat()
            format.scale = 1
            let fallback = UIGraphicsImageRenderer(size: CGSize(width: 600, height: 520), format: format).jpegData(withCompressionQuality: 0.8) { context in
                (index == 0 ? UIColor.systemOrange : UIColor.systemGreen).setFill()
                context.fill(CGRect(x: 0, y: 0, width: 600, height: 520))
            }
            let normalized = DiningReflectionPhotoStore.normalizedJPEGData(supplied ?? fallback)
            filenames.append(normalized.flatMap { try? DiningReflectionPhotoStore.save($0, entryID: Self.mainID) })
        }
        let date = Calendar(identifier: .gregorian).date(from: DateComponents(timeZone: TimeZone(identifier: "Asia/Seoul"), year: 2026, month: 10, day: 4, hour: 19, minute: 30))!
        var selections: [DiningSensorySelection] = []
        for (axis, label) in [(TasteAxis.sweet, "퍼지는 달콤함"), (.bitter, "또렷한 쌉쌀함")] {
            if let taste = TasteExperienceCatalog.experiences.first(where: { $0.axis == axis && $0.label == label }) {
                selections.append(.init(id: taste.id, type: .bubble, catalogVersion: DiningSensorySelection.currentCatalogVersion,
                                        labelSnapshot: taste.label, liking: .liked, intensity: .medium, preferenceFit: .justRight))
            }
        }
        if let tag = DiningDetailTagCatalog.metadata(for: "aroma-roasted") {
            selections.append(.init(id: tag.id, type: .detailTag, labelSnapshot: tag.label))
        }
        let main = DiningEntry(id: Self.mainID, restaurant: "저저", restaurantID: contextQA ? "fixture-place-a" : nil, menu: "버터 파스타", date: date, savedAt: date,
                               rating: 0, note: empty ? "" : "버터 향이 진하고 소스가 면에 부드럽게 감겼다. 끝에 남는 고소한 여운이 좋았다.",
                               sensorySelections: empty ? [] : selections,
                               overallEvaluation: empty ? nil : .init(response: .liked),
                               reflectionPhotoFilename: filenames[0],
                               additionalPhotoFilenames: filenames.dropFirst().compactMap { $0 },
                               mealTime: .init(source: .confirmed, start: date))
        model.addDiningEntry(main)
        if contextQA {
            model.addDiningEntry(.init(restaurant: "검증 식당 · B 지점", restaurantID: "fixture-place-b",
                                       menu: "검증 메뉴", date: date, rating: 0, note: "합성 기록",
                                       mealTime: .init(source: .confirmed, start: date), foodSource: .init(kind: "restaurant")))
        }
        _model = StateObject(wrappedValue: model)
    }

    var body: some View {
        DiningView()
            .fullScreenCover(isPresented: $showsDetail) { FoodMemoryDetailView(entryID: Self.mainID) }
            .environmentObject(model)
    }
}

#endif
