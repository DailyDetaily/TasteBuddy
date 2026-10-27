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
            photoFilename: card.photoFilename, showsMedia: true, illustrationSeed: card.id,
            showsStack: showsStack, isStackExpanded: isStackExpanded, onToggleStack: onToggleStack,
            onOpenContent: onOpen,
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
    @State private var selectedDetail: TasteCardDetailRoute?
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
                                HomeDiscoveryStackCard(card: card, onOpen: { selectedDetail = .discovery(card.id) })
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
        .tasteDetail($selectedDetail)
        .modifier(PersonalTasteAnswerToast(bottomPadding: TBSpacing.x12))
        .onChange(of: appModel.memoryAccountGeneration) { _, _ in dismiss() }
        .accessibilityIdentifier("home-journal-stack-list")
    }
}

/// 카드 ID로 현재 후보를 다시 찾는다. 수정/삭제 후 옛 원본 묶음을 계속 보여주지 않는다.
struct HomeDiscoveryDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    let discoveryID: String
    @State private var selectedPeriod: TasteDetailPeriod = .all
    private var referenceDate: Date { appModel.homeArchivePresentation?.referenceDay ?? .now }
    private var periodEntries: [DiningEntry] {
        HomeArchiveIdentity.entries(appModel.diningEntries, asOf: referenceDate).filter { entry in
            guard selectedPeriod != .all else { return true }
            guard let date = entry.confirmedMealDate else { return false }
            return selectedPeriod.contains(date, referenceDate: referenceDate, calendar: .current)
        }
    }
    private var card: HomeDiscoveryCard? {
        guard selectedPeriod != .all else { return appModel.homeDiscovery(id: discoveryID) }
        var candidate = HomeDiscoveryEngine.cards(entries: periodEntries, snapshot: appModel.sensoryAnalysis,
                                                  referenceDate: referenceDate, calendar: .current)
            .first { $0.id == discoveryID }
        let window = selectedPeriod.tdWindow(referenceDate: referenceDate, calendar: .current)
        candidate?.dataScope = .selectedPeriod(window)
        if candidate?.evidenceBundle != nil { candidate?.evidenceBundle?.period = window }
        return candidate
    }

    var body: some View {
        TasteDetailPage(title: "발견") {
            TasteDetailPeriodPicker(selection: $selectedPeriod)
        } content: {
            if appModel.sensoryAnalysisIsUpdating {
                ProgressView("불러오는 중").frame(maxWidth: .infinity, minHeight: 180)
            } else if let card {
                TasteDiscoverySummary(card: card)
            } else {
                Text(appModel.sensoryAnalysisError ?? "이 기간의 발견이 없어요").tbTextStyle(.body).padding(TBSpacing.page)
            }
        }
        .task(id: card?.semanticKey) { appModel.markHomeDiscoveryRead(id: discoveryID) }
    }
}

/// The same hierarchy is used for discoveries opened from Home and a category.
struct TasteDiscoverySummary: View {
    @EnvironmentObject private var appModel: AppModel
    let card: HomeDiscoveryCard
    private var entries: [DiningEntry] { appModel.diningEntries.filter { card.entryIDs.contains($0.id) } }
    var body: some View {
        VStack(alignment: .leading, spacing: TBSpacing.x20) {
            SectionCard(showsBorder: false) {
                VStack(alignment: .leading, spacing: TBSpacing.x16) {
                TasteDetailScope(text: card.kind.label)
                Text(card.title).font(TBFont.bold(18)).foregroundStyle(TBColor.textPrimary)
                    .fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("home-discovery-detail-title")
                if !card.detail.isEmpty && card.detail != card.title {
                    Text(card.detail).font(TBFont.regular(13)).foregroundStyle(TBColor.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                TasteDetailScope(text: card.dataScope.label(calendar: .current))
                }
            }.padding(.horizontal, TBSpacing.page)
            TasteDetailGroup {
                TasteDetailValueRow(title: "관련 식사", value: "\(Set(entries.map(\.mealID)).count)회", showsDivider: false)
                TasteDetailValueRow(title: "요리 기록", value: "\(entries.count)개")
            }.padding(.horizontal, TBSpacing.page)
            TasteDetailDisclosure() {
                if !card.evidenceSummary.isEmpty {
                    Text(card.evidenceSummary).accessibilityIdentifier("home-discovery-evidence-summary")
                }
                if !card.explanation.isEmpty { Text(card.explanation) }
                ForEach(card.limitations, id: \.self) { Text($0) }
            }.padding(.horizontal, TBSpacing.page)
        }.padding(.bottom, TBSpacing.page)
    }
}
