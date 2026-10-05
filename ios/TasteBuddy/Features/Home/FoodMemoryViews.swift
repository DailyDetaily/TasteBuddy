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
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let entryID: UUID
    @State private var showsOptions = false
    @State private var showsPhotoPicker = false
    @State private var photoPickerItems: [PhotosPickerItem] = []
    @State private var showsPhotoManager = false
    @State private var isSavingPhoto = false
    @State private var photoError: String?
    @State private var showsCorrection = false
    @State private var showsFullEditor = false
    @State private var showsComparison = false
    @State private var showsHistory = false
    @State private var showsLegacySummary = false
    @State private var showsDelete = false
    @State private var selectedTaste: FoodMemoryTaste?
    private var entry: DiningEntry? { appModel.diningEntry(id: entryID) }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                TopAppBar(
                    appearance: .solid,
                    title: "음식 기억",
                    showBack: true,
                    showsDefaultActions: false,
                    rightActions: entry == nil ? [] : [
                        .init(id: "record-options", symbol: "ellipsis", accessibilityLabel: "기록 옵션") {
                            showsOptions = true
                        }
                    ],
                    onBack: { dismiss() }
                )

                ScrollView {
                    if let entry {
                        recordContent(entry)
                    } else {
                        Text("삭제되었거나 현재 계정에서 볼 수 없는 기록이에요.")
                            .font(TBFont.regular(15))
                            .foregroundStyle(TBColor.textSecondary)
                            .tbPageContentPadding()
                    }
                }
                .scrollIndicators(.hidden)
                .scrollBounceBehavior(.basedOnSize)
            }
            .tbScreenTopChrome()
            .toolbar(.hidden, for: .navigationBar)
            .tbPageBackground()
        }
        .edgeSwipeBack { dismiss() }
        .accessibilityAction(.escape) { dismiss() }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
        .confirmationDialog("기록 옵션", isPresented: $showsOptions, titleVisibility: .hidden) {
            Button("기록 수정") { showsFullEditor = true }
            Button("사진 추가") { showsPhotoPicker = true }
                .disabled(isSavingPhoto || (entry?.allReflectionPhotoFilenames.count ?? 0) >= FoodMemoryDetailPresentation.maximumPhotoCount)
            if !(entry?.allReflectionPhotoFilenames.isEmpty ?? true) {
                Button("사진 관리") { showsPhotoManager = true }
                    .disabled(isSavingPhoto)
            }
            Button("메모·날짜 수정") { showsCorrection = true }
            Button("경험 비교") { showsComparison = true }
            if let entry, FoodMemoryDetailPresentation(entry: entry).isGeneratedNote {
                Button("이전 요약 보기") { showsLegacySummary = true }
            }
            if !(entry?.memoryCorrections?.isEmpty ?? true) {
                Button("수정 이력") { showsHistory = true }
            }
            Button("기록 삭제", role: .destructive) { showsDelete = true }
            Button("취소", role: .cancel) {}
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
        .sheet(isPresented: $showsCorrection) {
            if let entry { FoodMemoryCorrectionSheet(original: entry) }
        }
        .fullScreenCover(isPresented: $showsFullEditor) {
            if let entry {
                DiningFeedbackSheet(entry: entry) { appModel.updateDiningEntry($0, expected: entry) }
            }
        }
        .sheet(isPresented: $showsComparison) { FoodMemoryComparisonView(scope: .related(entryID)) }
        .sheet(isPresented: $showsHistory) { FoodMemoryHistorySheet(entryID: entryID) }
        .sheet(isPresented: $showsLegacySummary) {
            if let entry { FoodMemoryStoredNoteSheet(note: entry.note) }
        }
        .sheet(item: $selectedTaste) { FoodMemoryTasteSheet(taste: $0) }
        .alert("이 기록을 삭제할까요?", isPresented: $showsDelete) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) { appModel.removeDiningEntry(id: entryID) }
        } message: { Text("사진과 기록이 함께 삭제돼요.") }
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
            FoodMemoryPhotoCarousel(photos: presentation.photos, canAdd: presentation.photos.count < FoodMemoryDetailPresentation.maximumPhotoCount) {
                showsPhotoPicker = true
            }
            .disabled(isSavingPhoto)
            .overlay { if isSavingPhoto { ProgressView().padding(16).background(.regularMaterial, in: Circle()) } }

            VStack(alignment: .leading, spacing: 28) {
                identity(entry, date: presentation.dateLabel)

                if !presentation.tastes.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("기억에 남은 맛")
                            .font(TBFont.semibold(15))
                        TBWrapLayout(spacing: 8) {
                            ForEach(presentation.tastes) { taste in
                                Button { selectedTaste = taste } label: {
                                    TasteChip(
                                        title: taste.label,
                                        tone: taste.axis == nil ? .neutral : .taste,
                                        colorAxis: taste.axis,
                                        size: .sm
                                    )
                                    .frame(minHeight: 44)
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(TBTokenButtonStyle())
                                .accessibilityLabel(taste.accessibilityLabel)
                                .accessibilityHint("남긴 응답 보기")
                            }
                        }
                    }
                }

                if !presentation.isGeneratedNote, !entry.note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("메모")
                                .font(TBFont.semibold(15))
                            Spacer()
                            Button { showsCorrection = true } label: {
                                LucideIcon(.pencil, size: 16, strokeWidth: TBIcon.Stroke.regular)
                                    .foregroundStyle(TBColor.iconPrimary)
                                    .frame(width: 44, height: 44)
                                    .contentShape(Rectangle())
                            }
                            .buttonStyle(TBTokenButtonStyle())
                            .accessibilityLabel("메모·날짜 수정")
                        }
                        .frame(height: 28)
                        Text(entry.note)
                            .font(TBFont.regular(15))
                            .foregroundStyle(TBColor.textBody)
                            .lineSpacing(5)
                            .textSelection(.enabled)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }

                if let error = photoError ?? appModel.diningPersistenceError {
                    Callout(message: error, tone: .critical)
                }
            }
            .foregroundStyle(TBColor.textPrimary)
            .padding(.horizontal, TBSpacing.page)
            .padding(.top, 24)
            .padding(.bottom, 36)
        }
    }

    private func identity(_ entry: DiningEntry, date: String?) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(entry.menu.isEmpty ? "음식 기록" : entry.menu)
                .font(TBFont.bold(26))
                .fixedSize(horizontal: false, vertical: true)

            if !entry.restaurant.isEmpty {
                Text(entry.restaurant)
                    .font(TBFont.medium(14))
                    .foregroundStyle(TBColor.textSecondary)
            }

            ViewThatFits(in: .horizontal) {
                HStack(spacing: 12) {
                    dateButton(date)
                    Spacer(minLength: 12)
                    overallEvaluation(entry)
                }
                VStack(alignment: .leading, spacing: 12) {
                    dateButton(date)
                    overallEvaluation(entry)
                }
            }
        }
    }

    @ViewBuilder
    private func dateButton(_ date: String?) -> some View {
        if let date {
            Button { showsCorrection = true } label: {
                Text(date)
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textSecondary)
                    .frame(minHeight: 44, alignment: .leading)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(date), 날짜 수정")
        }
    }

    @ViewBuilder
    private func overallEvaluation(_ entry: DiningEntry) -> some View {
        if let evaluation = entry.overallEvaluation {
            Text(evaluation.responseLabelSnapshot)
                .font(TBFont.semibold(13))
                .foregroundStyle(TBColor.textPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(TBColor.mutedSurface, in: Capsule())
                .accessibilityLabel("전체 평가, \(evaluation.responseLabelSnapshot)")
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
    let canAdd: Bool
    let onAddPhoto: () -> Void
    @State private var selection = 0

    var body: some View {
        Group {
            if photos.isEmpty {
                Button(action: onAddPhoto) {
                    VStack(spacing: 10) {
                        LucideIcon(.image, size: 28, strokeWidth: TBIcon.Stroke.thin)
                        Text("사진 추가").font(TBFont.medium(13))
                    }
                    .foregroundStyle(TBColor.textSecondary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 200)
                    .background(TBColor.mutedSurface)
                }
                .buttonStyle(.plain)
            } else {
                GeometryReader { proxy in
                    TabView(selection: $selection) {
                        ForEach(Array(photos.enumerated()), id: \.element.id) { index, photo in
                            FoodMemoryPhotoPage(photo: photo, size: proxy.size)
                                .tag(index)
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                    .overlay(alignment: .topTrailing) {
                        if canAdd {
                            Button(action: onAddPhoto) {
                                LucideIcon(.plus, size: 20, strokeWidth: TBIcon.Stroke.regular)
                                    .foregroundStyle(.white)
                                    .frame(width: 44, height: 44)
                                    .background(.black.opacity(0.45), in: Circle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("사진 추가")
                            .padding(16)
                        }
                    }
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
                }
                .aspectRatio(1.15, contentMode: .fit)
                .clipped()
                .onChange(of: photos) { _, _ in selection = 0 }
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("food-memory-photos")
            }
        }
    }
}

private struct FoodMemoryPhotoPage: View {
    @Environment(\.displayScale) private var scale
    let photo: FoodMemoryPhoto
    let size: CGSize
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
        .frame(width: size.width, height: size.height)
        .background(TBColor.mutedSurface)
        .clipped()
        .accessibilityLabel("\(photo.menu) 사진")
        .onReceive(NotificationCenter.default.publisher(for: DiningReflectionPhotoStore.didChangeNotification)) { _ in photoRevision &+= 1 }
        .task(id: "\(photo.filename)-\(photoRevision)-\(Int(size.width * scale))") {
            image = nil
            finished = false
            loadedFilename = photo.filename
            let thumbnail = await DiningReflectionPhotoStore.thumbnail(for: photo.filename, fillingSquareOf: max(1, Int(size.width * scale)))
            guard !Task.isCancelled else { return }
            image = thumbnail
            finished = true
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

struct DiningMealTimeEditor: View {
    @Binding var value: DiningMealTime?
    var body: some View {
        DisclosureGroup("식사 시점 · 선택사항") {
            Picker("날짜의 의미", selection: Binding<DiningMealTime.Source?>(get: { value?.source }, set: { source in
                guard let source else { return }
                value = .init(source: source, start: [.confirmed, .approximate].contains(source) ? (value?.start ?? .now) : nil,
                              end: source == .approximate ? value?.end ?? .now : nil, confirmedAt: .now)
            })) {
                if value == nil { Text("이전 날짜 출처 유지").tag(Optional<DiningMealTime.Source>.none) }
                if let source = value?.source, !DiningMealTime.Source.allCases.contains(source) { Text(source.label).tag(Optional(source)) }
                ForEach(DiningMealTime.Source.allCases) { Text($0.label).tag(Optional($0)) }
            }
            if let source = value?.source, [.confirmed, .approximate].contains(source) {
                DatePicker(source == .confirmed ? "식사일" : "기간 시작", selection: Binding(get: { value?.start ?? .now }, set: { value?.start = $0; value?.confirmedAt = .now }), displayedComponents: .date)
                if source == .approximate {
                    DatePicker("기간 끝", selection: Binding(get: { value?.end ?? .now }, set: { value?.end = $0; value?.confirmedAt = .now }), in: (value?.start ?? .distantPast)..., displayedComponents: .date)
                }
            }
            Text(value?.source.label ?? "이전 날짜의 출처는 미확인이에요. 모르면 그대로 둘 수 있어요.").font(TBFont.regular(12))
        }.font(TBFont.regular(14))
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

    init(_ original: DiningEntry) {
        self.original = original
        note = original.note
        mealTime = original.mealTime
        foodSource = original.foodSource
    }

    func hasChanges(comparedTo original: DiningEntry) -> Bool {
        self != FoodMemoryCorrectionDraft(original)
    }

    func updating(_ original: DiningEntry) -> DiningEntry {
        var edited = original
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

private struct FoodMemoryCorrectionSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    @FocusState private var noteIsFocused: Bool
    @AccessibilityFocusState private var errorIsFocused: Bool
    @State private var draft: FoodMemoryCorrectionDraft
    @State private var showsDiscardConfirmation = false
    @State private var saveError: String?

    init(original: DiningEntry) {
        _draft = State(initialValue: FoodMemoryCorrectionDraft(original))
    }

    private var original: DiningEntry { draft.original }
    private var hasChanges: Bool { draft.hasChanges(comparedTo: original) }

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: TBSpacing.section) {
                        if let saveError {
                            Callout(message: saveError, title: "저장하지 못했어요", tone: .critical)
                                .id("correction-save-error")
                                .accessibilityElement(children: .combine)
                                .accessibilityFocused($errorIsFocused)
                        }
                        TBTextArea(
                            text: $draft.note,
                            label: "현재 회고",
                            placeholder: "기억에 남는 맛과 상황을 적어 주세요.",
                            accessibilityName: "회고 원문 수정",
                            helperText: "감각 응답과 음식 전체 평가는 그대로 유지돼요.",
                            minimumHeight: 180,
                            focus: $noteIsFocused
                        )
                        SectionCard {
                            VStack(alignment: .leading, spacing: TBSpacing.x16) {
                                DiningMealTimeEditor(value: $draft.mealTime)
                                Divider().overlay(TBColor.borderSubtle)
                                DiningFoodSourceEditor(value: $draft.foodSource)
                            }
                            .font(TBFont.regular(14))
                            .foregroundStyle(TBColor.textPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .tbPageContentPadding()
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: saveError) { _, message in
                    if message != nil {
                        proxy.scrollTo("correction-save-error", anchor: .top)
                        errorIsFocused = true
                    }
                }
            }
            .tbPageBackground()
            .navigationTitle("기록 바로잡기")
            .tbInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") {
                        if hasChanges { showsDiscardConfirmation = true }
                        else { dismiss() }
                    }
                    .font(TBFont.medium(14))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("저장", action: save)
                        .font(TBFont.semibold(14))
                        .disabled(!hasChanges)
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("키보드 닫기") { noteIsFocused = false }
                        .font(TBFont.medium(14))
                }
            }
        }
        .interactiveDismissDisabled(hasChanges)
        .alert("변경 내용을 버릴까요?", isPresented: $showsDiscardConfirmation) {
            Button("계속 수정", role: .cancel) {}
            Button("변경 내용 버리기", role: .destructive) { dismiss() }
        } message: {
            Text("저장하지 않은 수정만 사라져요. 기존 기록은 유지돼요.")
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
    }

    private func save() {
        guard hasChanges else { return }
        noteIsFocused = false
        saveError = nil
        // Synchronous local persistence already rejects a changed/deleted original.
        // Do not add artificial loading or claim that remote synchronization finished.
        if appModel.updateDiningEntry(draft.updating(original), expected: original) {
            dismiss()
        } else {
            saveError = appModel.diningPersistenceError ?? "기록을 저장하지 못했어요. 다시 시도해 주세요."
        }
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
        let directory = ProcessInfo.processInfo.environment["TB_FOOD_MEMORY_PREVIEW_PHOTOS"]
        let files = ["hero-food.png", "second-food.png"]
        var filenames: [String?] = []
        for (index, file) in files.enumerated() {
            if empty { filenames.append(nil); continue }
            let supplied = directory.flatMap { try? Data(contentsOf: URL(fileURLWithPath: $0).appendingPathComponent(file)) }
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
        let main = DiningEntry(id: Self.mainID, restaurant: "온지음", menu: "구운 배", date: date, savedAt: date,
                               rating: 0, note: empty ? "" : "겉은 살짝 바삭하고 속은 촉촉했다. 끝에 남는 은은한 단맛이 좋았다.",
                               sensorySelections: empty ? [] : selections,
                               overallEvaluation: empty ? nil : .init(response: .liked),
                               reflectionPhotoFilename: filenames[0],
                               additionalPhotoFilenames: filenames.dropFirst().compactMap { $0 },
                               mealTime: .init(source: .confirmed, start: date))
        model.addDiningEntry(main)
        _model = StateObject(wrappedValue: model)
    }

    var body: some View {
        DiningView()
            .fullScreenCover(isPresented: $showsDetail) { FoodMemoryDetailView(entryID: Self.mainID) }
            .environmentObject(model)
    }
}

#endif
