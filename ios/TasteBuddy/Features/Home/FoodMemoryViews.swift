import SwiftUI

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
        ((try? DiningFeedbackFixtureLoader.load())?.dishKindOptions ?? []).map { ($0.id, $0.label) })
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
    @State private var showsCorrection = false
    @State private var showsFullEditor = false
    @State private var showsComparison = false
    @State private var showsDelete = false
    @State private var actionMessage: String?
    private var entry: DiningEntry? { appModel.diningEntry(id: entryID) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.x16) {
                    if let entry {
                        Text(entry.menu.isEmpty ? "메뉴 미기록" : entry.menu).font(TBFont.bold(22))
                        Text(entry.restaurant).font(TBFont.medium(15))
                        Text(entry.memoryDateDescription).font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary)
                        if let filename = entry.reflectionPhotoFilename,
                           let data = try? DiningReflectionPhotoStore.originalData(for: filename), let image = UIImage(data: data) {
                            Image(uiImage: image).resizable().scaledToFit().clipShape(RoundedRectangle(cornerRadius: 16))
                                .accessibilityLabel("저장한 음식 사진")
                        } else if entry.reflectionPhotoFilename != nil {
                            Text("사진 연결은 남아 있어요. 이 기기에서 사진 원본을 아직 읽지 못했어요.")
                                .font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary)
                        }
                        SectionCard {
                            VStack(alignment: .leading, spacing: TBSpacing.x8) {
                                Text("저장한 원문").font(TBFont.semibold(14))
                                Text(entry.note.isEmpty ? "작성한 회고가 없어요." : entry.note).font(TBFont.regular(15)).textSelection(.enabled)
                                Text("현재 원본 수정 \(entry.memoryRevisionNumber) · 식사 \(entry.mealID.uuidString.prefix(8))")
                                    .font(TBFont.regular(11)).foregroundStyle(TBColor.textSecondary)
                            }.frame(maxWidth: .infinity, alignment: .leading)
                        }
                        if let overall = entry.overallEvaluation {
                            SectionCard {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(overall.questionLabelSnapshot).font(TBFont.semibold(14))
                                    Text(overall.responseLabelSnapshot).font(TBFont.regular(14))
                                    Text("음식 전체 · 직접 응답").font(TBFont.regular(12))
                                }
                            }
                        }
                        if let selections = entry.sensorySelections {
                            ForEach(Array(selections.enumerated()), id: \.offset) { _, selection in
                                SectionCard {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(selection.labelSnapshot).font(TBFont.semibold(14))
                                        Text("호감: \(selection.liking?.label ?? "미응답") · 강도: \(selection.intensity?.label ?? "미응답") · 알맞음: \(selection.preferenceFit?.label ?? "미응답")")
                                        Text("대상: \(selection.target.label) · 시점: \(selection.phase.label)")
                                    }.font(TBFont.regular(12))
                                }
                            }
                        } else {
                            Text("이전 선택 ID: \((entry.tasteExperienceIDs + entry.detailTagIDs).joined(separator: " · ")) · 당시 직접 응답은 미확인")
                                .font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
                        }
                        if appModel.sensoryAnalysisIsUpdating { ProgressView("현재 원문으로 해석 갱신 중") }
                        else {
                            SensoryEvidenceList(observations: appModel.sensoryAnalysis.observations.filter { $0.experienceID == entryID }, unresolved: appModel.sensoryAnalysis.unresolved.filter { $0.experienceID == entryID }, showsMemoryActions: false)
                        }
                        Button("관련 경험과 비교") { showsComparison = true }
                        Button("회고·식사 시점 바로잡기") { showsCorrection = true }
                        Button("전체 기록·감각 응답 수정") { showsFullEditor = true }
                        if let latest = entry.memoryCorrections?.last {
                            SectionCard {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("이해를 바로잡은 기록").font(TBFont.semibold(14))
                                    Text("\(latest.changedAt.formatted(date: .abbreviated, time: .shortened)) · \(latest.scopeLabel)")
                                    Text("교정은 새 식사나 취향 전환으로 세지 않아요. 이전 원문은 현재 해석 근거로 사용하지 않아요.")
                                    if case .string(let before) = latest.before["note"] { Text("이전 회고: \(before)") }
                                    if case .string(let after) = latest.after["note"] { Text("현재 회고: \(after)") }
                                    if !latest.before.isEmpty {
                                        Button("이전 수정 되돌리기") {
                                            actionMessage = appModel.undoMemoryCorrection(entryID: entryID) ? "수정을 되돌렸어요. 다시 누르면 재적용할 수 있어요." : "현재 원본을 확인한 뒤 다시 시도해 주세요."
                                        }
                                    }
                                }.font(TBFont.regular(13))
                            }
                        }
                        Button("내가 먹은 기록이 아님 · 삭제", role: .destructive) { showsDelete = true }
                        if let actionMessage { Text(actionMessage).font(TBFont.regular(13)) }
                        if let error = appModel.diningPersistenceError { Text(error).foregroundStyle(TBColor.textSecondary) }
                        Text(appModel.memorySyncDescription).font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
                    } else {
                        Text("삭제되었거나 현재 계정에서 볼 수 없는 기록이에요.").font(TBFont.regular(15))
                    }
                }.foregroundStyle(TBColor.textPrimary).tbPageContentPadding()
            }.tbPageBackground().navigationTitle("음식 기억").tbInlineNavigationTitle()
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } } }
        }
        .sheet(isPresented: $showsCorrection) { if let entry { FoodMemoryCorrectionSheet(original: entry) } }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
        .fullScreenCover(isPresented: $showsFullEditor) {
            if let entry { DiningFeedbackSheet(entry: entry) { appModel.updateDiningEntry($0, expected: entry) } }
        }
        .sheet(isPresented: $showsComparison) { FoodMemoryComparisonView(scope: .related(entryID)) }
        .alert("이 기록을 삭제할까요?", isPresented: $showsDelete) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) { appModel.removeDiningEntry(id: entryID) }
        } message: { Text("원문과 교정 이력, 검색·분석 근거에서 제거해요. 원격 백업 삭제는 동기화가 완료되면 반영돼요.") }
    }
}

/// 값으로 전달된 이전 인사이트 시트는 원본 변경·계정 전환 뒤 현재 해석처럼 남지 않는다.
struct MemoryRevisionDismissal: ViewModifier {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    func body(content: Content) -> some View {
        content.onChange(of: appModel.memoryGeneration) { _, _ in dismiss() }
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

private struct FoodMemoryCorrectionSheet: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let original: DiningEntry
    @State private var note: String
    @State private var mealTime: DiningMealTime?
    init(original: DiningEntry) { self.original = original; _note = State(initialValue: original.note); _mealTime = State(initialValue: original.mealTime) }
    var body: some View {
        NavigationStack {
            Form {
                Section("현재 회고") { TextEditor(text: $note).frame(minHeight: 180).accessibilityLabel("회고 원문 수정") }
                Text("전체 평가·감각 응답은 별도로 유지해요. ‘앞으로 덜 달게’ 같은 목표는 과거 호감으로 바꾸지 않아요.")
                DiningMealTimeEditor(value: $mealTime)
                if let error = appModel.diningPersistenceError { Text(error) }
            }.navigationTitle("기록 바로잡기")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("취소") { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("저장") {
                            var edited = original; edited.note = note; edited.mealTime = mealTime
                            if let date = mealTime?.confirmedDate { edited.date = date; edited.observedAt = date }
                            if appModel.updateDiningEntry(edited, expected: original) { dismiss() }
                        }
                    }
                }
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
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
#endif
