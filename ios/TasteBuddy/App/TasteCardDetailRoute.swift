import SwiftUI

/// Navigation carries identities and query settings, never a captured source view or its @State.
/// AppShell unmounts the previous screen; destinations must resolve their own current data.
enum TasteCardDetailRoute: Hashable, Identifiable {
    case archiveMetric(id: String, title: String)
    case discovery(String)
    case sensory(SensoryAnalysisDetailSelection)
    case perception(TastePerceptionDetailRequest)
    case category(TDCardDetailRequest)

    var id: String {
        switch self {
        case .archiveMetric(let id, _): "archive:" + id
        case .discovery(let id): "discovery:" + id
        case .sensory(let selection): "sensory:" + selection.id
        case .perception(let request): "perception:" + request.id
        case .category(let request): "category:" + request.id.uuidString
        }
    }
    var title: String {
        switch self {
        case .archiveMetric(_, let title): title
        case .discovery: "발견"
        case .sensory(let selection): selection.title
        case .perception(let request): request == .conditions ? "조건별 차이" : "감각 패턴"
        case .category(let request): request.title
        }
    }
}

enum SensoryAnalysisDetailSelection: Hashable, Identifiable {
    case evidence
    case heroEvidence
    case insight(String)
    case personalCandidate(String)
    case personalInsight(String)
    case questionEvidence(String)
    case selection(evidenceIDs: [String], unresolvedEntryIDs: [UUID])

    var id: String {
        switch self {
        case .evidence: "evidence"
        case .heroEvidence: "hero-evidence"
        case .insight(let id): "insight:" + id
        case .personalCandidate(let id): "personal-candidate:" + id
        case .personalInsight(let id): "personal-insight:" + id
        case .questionEvidence(let id): "question-evidence:" + id
        case .selection(let ids, let entries): "selection:" + (ids + entries.map(\.uuidString)).joined(separator: "|")
        }
    }
    var title: String {
        switch self {
        case .evidence, .selection, .questionEvidence: "기록 근거"
        case .heroEvidence: "나의 미각 타입"
        case .insight: "인사이트"
        case .personalCandidate: "조건별 입맛"
        case .personalInsight: "평가와 조건"
        }
    }
}

enum TastePerceptionDetailRequest: Hashable, Identifiable {
    case meal(referenceOnly: Bool)
    case survey(referenceOnly: Bool)
    case conditions
    var id: String {
        switch self {
        case .meal(let reference): "meal-\(reference)"
        case .survey(let reference): "survey-\(reference)"
        case .conditions: "conditions"
        }
    }
}

struct TasteCardDetailDestination: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.tasteDetailChrome) private var chrome
    let route: TasteCardDetailRoute

    var body: some View {
        destination
            .accessibilityIdentifier("taste-card-detail-screen")
            .onChange(of: appModel.memoryAccountGeneration) { _, _ in chrome?.onBack() }
    }

    @ViewBuilder private var destination: some View {
        switch route {
        case .archiveMetric(let id, _): HomeArchiveMetricDetailView(metricID: id)
        case .discovery(let id): HomeDiscoveryDetailView(discoveryID: id)
        case .sensory(let selection): SensoryAnalysisDetailView(selection: selection)
        case .perception(let request): TastePerceptionDetailView(request: request)
        case .category(let request): TDCategoryCardDetailView(request: request)
        }
    }
}

struct SensoryAnalysisDetailView: View {
    @EnvironmentObject private var appModel: AppModel
    let selection: SensoryAnalysisDetailSelection
    private var snapshot: SensoryAnalysisSnapshot { appModel.sensoryAnalysis }

    @ViewBuilder var body: some View {
        switch selection {
        case .evidence:
            SensoryEvidenceDetailView(observations: snapshot.observations, unresolved: snapshot.unresolved)
        case .heroEvidence:
            let selected = [snapshot.mainWing.main, snapshot.mainWing.wing].compactMap { $0 }
            let candidates = selected.isEmpty ? snapshot.mainWing.candidates : selected
            let ids = Set(candidates.flatMap { $0.supportEvidenceIDs + $0.counterEvidenceIDs })
            SensoryEvidenceDetailView(observations: snapshot.observations.filter { ids.contains($0.id) }, unresolved: [])
        case .insight(let id):
            if let insight = snapshot.insights.first(where: { $0.id == id }) {
                let ids = Set(insight.evidenceIDs)
                SensoryInsightDetailView(insight: insight, observations: snapshot.observations.filter { ids.contains($0.id) },
                                         unresolved: [], limits: snapshot.limits)
            } else { unavailable }
        case .personalCandidate(let id):
            if let model = snapshot.personalModel,
               let group = PersonalTasteCandidatePresentation.groups(model.candidates).first(where: { $0.id == id }) {
                PersonalTasteCandidateDetailView(group: group, observations: snapshot.observations,
                                                  entries: appModel.diningEntries, limits: model.limits + snapshot.limits,
                                                  unresolved: snapshot.unresolved)
            } else { unavailable }
        case .personalInsight(let id):
            if let group = PersonalTasteInsightPresentation.groups(snapshot.personalModel).first(where: { $0.id == id }) {
                PersonalTasteInsightDetailView(group: group, observations: snapshot.observations, entries: appModel.diningEntries)
            } else { unavailable }
        case .questionEvidence(let id):
            if let question = snapshot.personalModel?.availableSelections.first(where: { $0.id == id }) {
                let ids = Set(question.evidenceIDs)
                SensoryEvidenceDetailView(observations: snapshot.observations.filter { ids.contains($0.id) }, unresolved: [])
            } else { unavailable }
        case .selection(let evidenceIDs, let entryIDs):
            let ids = Set(evidenceIDs), entries = Set(entryIDs)
            SensoryEvidenceDetailView(observations: snapshot.observations.filter { ids.contains($0.id) },
                                      unresolved: snapshot.unresolved.filter { entries.contains($0.experienceID) })
        }
    }

    private var unavailable: some View {
        TasteDetailPage(title: selection.title) {
            VStack(alignment: .leading, spacing: TBSpacing.x12) {
                if appModel.sensoryAnalysisIsUpdating { ProgressView("현재 기록에서 해석을 갱신하고 있어요") }
                else { TasteDetailNote(title: "현재 연결된 해석이 없어요", detail: appModel.sensoryAnalysisError ?? "기록이 바뀌어 이 항목을 다시 확인해야 해요.") }
            }.tbPageContentPadding()
        }
    }
}
