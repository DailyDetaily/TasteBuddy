#if DEBUG || targetEnvironment(simulator)
import SwiftUI

struct SensoryV2RuntimePreview: View {
    private static let sample = DiningEntry(restaurant: "검증용 식당", menu: "아이스 우유 커피", rating: 0, note: "", sensorySelections: [], overallEvaluation: .init(response: .liked))
    @StateObject private var model = AppModel.preview(authEntryComplete: true, onboardingComplete: true, diningEntries: [sample])
    @State private var saved: DiningEntry?
    @State private var closed = false

    var body: some View {
        Group {
            if let saved, closed {
                VStack(alignment: .leading, spacing: 12) {
                    Text("검증용 기록 저장 완료").font(TBFont.bold(20))
                    Text(saved.menu)
                    ForEach(saved.sensorySelections ?? [], id: \.stableID) { selection in
                        Text(selection.labelSnapshot)
                            .accessibilityIdentifier("saved-" + selection.id)
                    }
                    Text("버블 \(saved.sensorySelections?.filter { $0.type == .bubble }.count ?? 0) · 디테일 \(saved.sensorySelections?.filter { $0.type == .detailTag }.count ?? 0)")
                }
                .padding(24)
            } else {
                DiningFeedbackSheet(entry: Self.sample, startMode: .tasteMap, onClose: { closed = true }) { value in
                    model.updateDiningEntry(value)
                    if model.diningPersistenceError == nil { saved = model.diningEntries.first { $0.id == value.id } }
                }
            }
        }
        .environmentObject(model)
    }
}
#endif
