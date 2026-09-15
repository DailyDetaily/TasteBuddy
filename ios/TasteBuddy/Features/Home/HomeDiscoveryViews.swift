import SwiftUI

struct HomeDiscoveryStackCard: View {
    @EnvironmentObject private var appModel: AppModel
    let card: HomeDiscoveryCard
    var showsStack = false
    var isStackExpanded = false
    var onToggleStack: (() -> Void)?
    let onOpen: () -> Void

    var body: some View {
        TasteQuestionStackCard(
            question: card.title, supportingText: card.detail, choices: [],
            photoFilename: card.photoFilename, showsMedia: card.photoFilename != nil,
            showsStack: showsStack, isStackExpanded: isStackExpanded, onToggleStack: onToggleStack,
            contentLabel: "발견 · \(card.kind.label)", onOpenContent: onOpen,
            stackAccessibilityLabel: "질문과 발견 카드",
            contentAccessibilityIdentifier: "home-discovery-open-\(card.kind.rawValue)"
        )
        .accessibilityIdentifier("home-discovery-card-\(card.kind.rawValue)")
        .contextMenu {
            Button("이 발견 7일간 보지 않기", systemImage: "clock") {
                appModel.suppressHomeDiscovery(id: card.id)
            }
        }
    }
}

/// 전체보기에서도 질문과 발견의 동작을 분리하고 같은 큐 순서를 사용한다.
struct HomeJournalStackListView: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    var onStartNewRecord: ((PersonalTasteNextSelection) -> Void)?
    @State private var selectedDiscoveryID: String?
    @State private var displayLimit = 24

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: TBSpacing.x12) {
                    if appModel.sensoryAnalysisIsUpdating {
                        SensoryAnalysisStatusCard(state: .processing)
                    } else if let error = appModel.sensoryAnalysisError {
                        SensoryAnalysisStatusCard(state: .failed(error))
                    } else {
                        let items = appModel.homeJournalStackItems
                        ForEach(Array(items.prefix(displayLimit))) { item in
                            switch item {
                            case .question(let question):
                                PersonalTasteNextQuestionCard(selection: question,
                                    onStartNewRecord: { onStartNewRecord?(question) },
                                    stackAccessibilityLabel: "질문과 발견 카드")
                            case .discovery(let card):
                                HomeDiscoveryStackCard(card: card, onOpen: { selectedDiscoveryID = card.id })
                            }
                        }
                        if items.count > displayLimit {
                            Button("카드 더 보기") { displayLimit += 24 }.frame(minHeight: 44)
                        }
                        if items.isEmpty {
                            Text("지금 확인할 질문이나 새로운 발견이 없어요.")
                                .font(TBFont.regular(14)).foregroundStyle(TBColor.textSecondary)
                        }
                    }
                }.tbPageContentPadding()
            }
            .tbPageBackground()
            .navigationTitle("질문과 발견 카드")
            .tbInlineNavigationTitle()
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } } }
        }
        .sheet(isPresented: Binding(get: { selectedDiscoveryID != nil }, set: { if !$0 { selectedDiscoveryID = nil } })) {
            if let selectedDiscoveryID { HomeDiscoveryDetailView(discoveryID: selectedDiscoveryID) }
        }
        .modifier(PersonalTasteAnswerToast(bottomPadding: TBSpacing.x12))
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
        .accessibilityIdentifier("home-journal-stack-list")
    }
}

/// 카드 ID로 현재 후보를 다시 찾는다. 수정/삭제 후 옛 원본 묶음을 계속 보여주지 않는다.
struct HomeDiscoveryDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.dismiss) private var dismiss
    let discoveryID: String
    @State private var selectedEntryID: UUID?
    @State private var showsComparison = false
    @State private var displayLimit = 40
    private var card: HomeDiscoveryCard? { appModel.homeDiscovery(id: discoveryID) }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: TBSpacing.x16) {
                    if appModel.sensoryAnalysisIsUpdating {
                        ProgressView("현재 기록에서 발견을 갱신하고 있어요")
                    } else if let card {
                        Text(card.kind.label).font(TBFont.medium(12)).foregroundStyle(TBColor.textSecondary)
                        Text(card.title).font(TBFont.bold(20)).accessibilityIdentifier("home-discovery-detail-title")
                        Text(card.detail).font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary)
                        Text(card.explanation).font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary)
                        if !card.evidenceSummary.isEmpty {
                            Text("계산에 사용한 직접 응답").font(TBFont.medium(13))
                            Text(card.evidenceSummary).font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary)
                                .accessibilityIdentifier("home-discovery-evidence-summary")
                        }
                        if !card.limitations.isEmpty {
                            Text("이 발견을 읽을 때").font(TBFont.medium(13))
                            ForEach(Array(card.limitations.enumerated()), id: \.offset) { _, limitation in
                                Text(limitation).font(TBFont.regular(12)).foregroundStyle(TBColor.textSecondary)
                            }
                        }
                        let documents = appModel.foodMemoryIndex.documents.filter { card.entryIDs.contains($0.id) }
                            .sorted { $0.entry.observedAt > $1.entry.observedAt }
                        Text("연결된 음식 기록 \(documents.count)개 · 식사 \(Set(documents.map { $0.entry.mealID }).count)번")
                            .font(TBFont.medium(13))
                        if Set(documents.map { $0.entry.mealID }).count > 1 {
                            Button("이 기록들 비교하기") { showsComparison = true }.frame(minHeight: 44)
                        }
                        ForEach(Array(documents.prefix(displayLimit))) { document in
                            Button { selectedEntryID = document.id } label: {
                                FoodMemoryRow(document: document)
                            }.buttonStyle(.plain)
                        }
                        if documents.count > displayLimit {
                            Button("연결된 기록 더 보기") { displayLimit += 40 }.frame(minHeight: 44)
                        }
                    } else {
                        Text(appModel.sensoryAnalysisError ?? "기록이 바뀌어 이 발견은 더 이상 표시하지 않아요.")
                            .font(TBFont.regular(14)).foregroundStyle(TBColor.textSecondary)
                    }
                }.tbPageContentPadding()
            }
            .tbPageBackground()
            .navigationTitle("발견 카드")
            .tbInlineNavigationTitle()
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } } }
        }
        .task(id: card?.semanticKey) { appModel.markHomeDiscoveryRead(id: discoveryID) }
        .sheet(isPresented: Binding(get: { selectedEntryID != nil }, set: { if !$0 { selectedEntryID = nil } })) {
            if let selectedEntryID { FoodMemoryDetailView(entryID: selectedEntryID) }
        }
        .sheet(isPresented: $showsComparison) {
            if let card { FoodMemoryComparisonView(scope: .entries(card.entryIDs.sorted { $0.uuidString < $1.uuidString })) }
        }
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
    }
}
