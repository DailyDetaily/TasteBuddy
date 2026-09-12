import SwiftUI
import UIKit

/// 브랜드 영상은 이 진입점에서 실제 앱 화면을 캡처한다. Release 앱에서는 활성화되지 않는다.
enum BrandVideoCaptureRuntime {
    enum Screen: String {
        case dining
        case feedback
        case analysis

        var tab: MainTab {
            self == .analysis ? .analysis : .dining
        }
    }

    static var isEnabled: Bool {
        ProcessInfo.processInfo.arguments.contains("--brand-video-preview")
    }

    static var requestedScreen: String {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: "--brand-video-screen"),
              arguments.indices.contains(index + 1) else { return "dining" }
        return arguments[index + 1]
    }

    static var screen: Screen? { Screen(rawValue: requestedScreen) }
    static var token: String { ProcessInfo.processInfo.environment["TB_BRAND_VIDEO_TOKEN"] ?? "" }
    static let photoFilename = "brand-video-01.jpg"

    @MainActor
    static func makeAppModel() -> AppModel {
        guard isEnabled else { return AppModel() }
        let model = AppModel.preview(
            authEntryComplete: true,
            onboardingComplete: true,
            diningEntries: BrandVideoFixtures.entries,
            dishFeedbackComments: [:],
            sessionRepository: FixtureBackendSessionRepository(status: .signedOut),
            authRepository: FixtureBackendAuthRepository(),
            publicProfileRepository: FixtureBackendPublicProfileRepository(identities: []),
            now: { BrandVideoFixtures.referenceDate }
        )
        model.saveProfileIdentity(UserProfileIdentity(
            displayName: "나",
            nickname: "tastebuddy",
            birthDate: nil,
            sexContext: nil,
            smokingStatus: nil,
            dietaryRestrictions: []
        ))
        return model
    }

    @MainActor
    static func writeSignal(status: String, model: AppModel, error: String? = nil) {
        let signal = CaptureSignal(
            schemaVersion: 1,
            token: token,
            screen: requestedScreen,
            status: status,
            source: "ios-swiftui",
            observationCount: model.sensoryAnalysis.observations.count,
            insightCount: model.sensoryAnalysis.insights.count,
            candidateCount: model.sensoryAnalysis.personalModel?.candidates.count ?? 0,
            error: error
        )
        do {
            let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            try FileManager.default.createDirectory(at: documents, withIntermediateDirectories: true)
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            try encoder.encode(signal).write(
                to: documents.appendingPathComponent("brand-video-ready.json"),
                options: .atomic
            )
        } catch {
            print("브랜드 영상 준비 신호를 저장하지 못했어요: \(error.localizedDescription)")
        }
    }

    private struct CaptureSignal: Encodable {
        let schemaVersion: Int
        let token: String
        let screen: String
        let status: String
        let source: String
        let observationCount: Int
        let insightCount: Int
        let candidateCount: Int
        let error: String?
    }
}

/// 별도 광고용 UI를 만들지 않고 현재 SwiftUI 화면과 구성 요소를 그대로 사용한다.
struct BrandVideoRuntimePreview: View {
    @EnvironmentObject private var model: AppModel
    @State private var hasLayout = false

    private var readiness: String {
        "\(hasLayout)-\(model.sensoryAnalysisIsUpdating)-\(model.sensoryAnalysisError ?? "")-\(model.sensoryAnalysis.observations.count)-\(model.sensoryAnalysis.insights.count)"
    }

    var body: some View {
        Group {
            if let screen = BrandVideoCaptureRuntime.screen {
                if screen == .feedback {
                    DiningFeedbackSheet(
                        entry: BrandVideoFixtures.entries[0],
                        startMode: .tasteMap,
                        onClose: {},
                        onSave: { _ in }
                    )
                } else {
                    AppShellView(initialTab: screen.tab)
                }
            } else {
                Color.clear
            }
        }
        .background {
            GeometryReader { proxy in
                Color.clear.onAppear {
                    hasLayout = proxy.size.width > 0 && proxy.size.height > 0
                }
            }
        }
        .task(id: readiness) {
            guard BrandVideoCaptureRuntime.isEnabled, hasLayout else { return }
            guard BrandVideoCaptureRuntime.screen != nil else {
                BrandVideoCaptureRuntime.writeSignal(status: "error", model: model, error: "지원하지 않는 화면이에요.")
                return
            }
            guard !BrandVideoCaptureRuntime.token.isEmpty else {
                BrandVideoCaptureRuntime.writeSignal(status: "error", model: model, error: "TB_BRAND_VIDEO_TOKEN이 필요해요.")
                return
            }
            guard !model.sensoryAnalysisIsUpdating else { return }
            if let error = model.sensoryAnalysisError {
                BrandVideoCaptureRuntime.writeSignal(status: "error", model: model, error: error)
                return
            }
            guard !model.sensoryAnalysis.observations.isEmpty,
                  !model.sensoryAnalysis.insights.isEmpty || !(model.sensoryAnalysis.personalModel?.candidates.isEmpty ?? true) else {
                return
            }
            if BrandVideoCaptureRuntime.screen == .dining {
                guard await DiningReflectionPhotoStore.thumbnail(
                    for: BrandVideoCaptureRuntime.photoFilename,
                    fillingSquareOf: 1_200
                ) != nil else {
                    BrandVideoCaptureRuntime.writeSignal(status: "error", model: model, error: "영상용 식사 사진을 앱 저장소에 먼저 복사해주세요.")
                    return
                }
            }
            // 분석 완료와 이미지 디코딩 이후 실제 SwiftUI 배치가 화면에 반영될 시간을 둔다.
            do {
                try await Task.sleep(for: .milliseconds(
                    BrandVideoCaptureRuntime.screen == .feedback ? 2_000 : 650
                ))
            } catch { return }
            guard !Task.isCancelled else { return }
            BrandVideoCaptureRuntime.writeSignal(status: "ready", model: model)
        }
    }
}

private enum BrandVideoFixtures {
    static let referenceDate = Date(timeIntervalSince1970: 1_788_652_800)

    private struct Meal {
        let title: String
        let liking: DiningSensorySelection.Liking
        let intensity: DiningSensorySelection.Intensity
        let overall: DiningOverallEvaluation.Response
    }

    // 각각 별도 식사의 직접 평가다. 실제 사용자 기록이나 계정은 읽지 않는다.
    static let entries: [DiningEntry] = {
        let meals: [Meal] = [
            .init(title: "저녁의 한 접시", liking: .liked, intensity: .light, overall: .veryLiked),
            .init(title: "은은한 유자 소스", liking: .liked, intensity: .light, overall: .liked),
            .init(title: "가벼운 레몬 소스", liking: .liked, intensity: .light, overall: .liked),
            .init(title: "매실 소스를 곁들인 저녁", liking: .liked, intensity: .light, overall: .veryLiked),
            .init(title: "산미가 진한 소스", liking: .disliked, intensity: .strong, overall: .disliked),
            .init(title: "라임 소스를 곁들인 생선", liking: .disliked, intensity: .strong, overall: .neutral),
            .init(title: "새콤한 드레싱", liking: .disliked, intensity: .strong, overall: .disliked),
            .init(title: "초절임 소스", liking: .disliked, intensity: .strong, overall: .disliked),
            .init(title: "산뜻한 소스를 곁들인 점심", liking: .neutral, intensity: .medium, overall: .neutral),
        ]
        return meals.enumerated().map { index, meal in
            let recordID = UUID(uuidString: String(format: "C0000000-0000-0000-0000-%012d", index + 1))!
            let observedAt = referenceDate.addingTimeInterval(Double(-index) * 86_400 * 4)
            return DiningEntry(
                id: recordID,
                mealID: recordID,
                restaurant: "나의 식탁",
                restaurantID: "brand-video-example",
                menu: meal.title,
                menuItemID: "brand-video-\(index + 1)",
                observedAt: observedAt,
                savedAt: observedAt.addingTimeInterval(900),
                rating: 0,
                note: "",
                tasteExperienceIDs: ["sour-fresh"],
                sensorySelections: [
                    .init(
                        id: "sour-fresh",
                        type: .bubble,
                        labelSnapshot: "산뜻한 산미",
                        liking: meal.liking,
                        intensity: meal.intensity,
                        target: .sauce,
                        phase: .lateMeal
                    ),
                ],
                overallEvaluation: .init(response: meal.overall),
                dishKindIDs: ["sauce_glaze"],
                reflectionPhotoFilename: index == 0 ? BrandVideoCaptureRuntime.photoFilename : nil
            )
        }
    }()
}
