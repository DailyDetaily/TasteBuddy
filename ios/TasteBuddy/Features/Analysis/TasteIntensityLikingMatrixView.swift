import SwiftUI

struct TasteIntensityLikingMatrixView: View {
    let observations: [SensoryObservation]
    let attribute: String
    let reference: String?
    var unresolved: [SensoryUnresolved] = []
    @State private var selectedDetail: TasteCardDetailRoute?
    private var matrix: TasteIntensityLikingMatrix { .build(observations: observations, attribute: attribute, reference: reference,
        unresolved: unresolved, catalog: SensoryAnalysisEngine.contract?.selectionCatalog) }
    private var axis: TasteAxis? { TastePerceptionEngine.axis(for: attribute) }

    var body: some View {
        TBPageSection(title: "강도와 호감", titleSize: .medium) {
            SectionCard {
                VStack(alignment: .leading, spacing: TBSpacing.x12) {
                    Grid(horizontalSpacing: 8, verticalSpacing: 8) {
                        GridRow {
                            Text("호감 / 강도")
                            ForEach(["약", "중", "강"], id: \.self) { Text($0) }
                        }.font(TBFont.medium(11))
                        ForEach(TasteIntensityLikingMatrix.likings, id: \.self) { liking in
                            GridRow {
                                Text(PersonalTasteInsightPresentation.likingLabel(liking)).font(TBFont.regular(11))
                                ForEach(matrix.cells.filter { $0.liking == liking }) { cell in
                                    Button { open(cell) } label: {
                                        HStack(spacing: TBSpacing.x4) {
                                            if !cell.entryIDs.isEmpty {
                                                Circle().fill(axis?.mainColor ?? TBColor.textSecondary)
                                                    .frame(width: 6, height: 6)
                                            }
                                            Text("\(cell.entryIDs.count)")
                                                .font(cell.entryIDs.isEmpty ? TBFont.regular(15) : TBFont.semibold(15))
                                        }
                                        .foregroundStyle(cell.entryIDs.isEmpty ? TBColor.textHint : (axis?.tintTextColor ?? TBColor.textPrimary))
                                        .frame(maxWidth: .infinity, minHeight: 44)
                                        .background(cell.entryIDs.isEmpty ? TBColor.mutedSurface : (axis?.tintColor ?? TBColor.mutedSurface),
                                                    in: RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                                        .overlay {
                                            RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                                                .strokeBorder(cell.entryIDs.isEmpty ? .clear : (axis?.tintSoftBorderColor ?? TBColor.borderSubtle), lineWidth: 1)
                                        }
                                    }.buttonStyle(.plain)
                                        .accessibilityIdentifier("taste-matrix-\(cell.id)")
                                        .accessibilityLabel("\(TastePerceptionEngine.levelLabels[TasteIntensityLikingMatrix.levels.firstIndex(of: cell.intensity)!]), \(PersonalTasteInsightPresentation.likingLabel(liking)), 음식 경험 \(cell.entryIDs.count)개, 독립 식사 \(cell.mealIDs.count)회")
                                }
                            }
                        }
                    }
                    TasteDetailScope(text: "요리 기록 기준 · 조건 간 중복 포함")
                    if !matrix.unknownEntryIDs.isEmpty || !matrix.conflictEntryIDs.isEmpty {
                        Button("미확인 \(matrix.unknownEntryIDs.count)개 · 응답 충돌 \(matrix.conflictEntryIDs.count)개") {
                            open(.init(intensity: "unknown", liking: "unknown", entryIDs: matrix.unknownEntryIDs.union(matrix.conflictEntryIDs), mealIDs: [],
                                       evidenceIDs: Set(observations.filter { matrix.unknownEntryIDs.union(matrix.conflictEntryIDs).contains($0.experienceID) }.map(\.id))))
                        }.font(TBFont.regular(12)).frame(minHeight: 44)
                    }
                }
            }
        }
        .tasteDetail($selectedDetail)
    }
    private func open(_ cell: TasteIntensityLikingMatrix.Cell) {
        selectedDetail = .sensory(.selection(evidenceIDs: cell.evidenceIDs.sorted(),
                                             unresolvedEntryIDs: cell.entryIDs.sorted { $0.uuidString < $1.uuidString }))
    }
}
