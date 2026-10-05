#if DEBUG
import SwiftUI
import UIKit

/// Isolated documentation fixtures. This exporter does not read or reset product data.
@MainActor
enum TypographyDocumentationCapture {
    private enum Kind: String, Codable {
        case role, dynamic, usage
    }

    private enum Category: String, Codable, CaseIterable {
        case large, xxxLarge, accessibility2

        var dynamicTypeSize: DynamicTypeSize {
            switch self {
            case .large: .large
            case .xxxLarge: .xxxLarge
            case .accessibility2: .accessibility2
            }
        }
    }

    private struct Capture: Codable {
        let id: String
        let kind: Kind
        let category: Category
        let file: String
        let width: Double
        let height: Double
    }

    private struct FontMetrics: Codable {
        let role: String
        let postScriptName: String
        let familyName: String
        let baseSize: Double
        let lineHeight: Double
        let ascender: Double
        let descender: Double
        let capHeight: Double
    }

    private struct Manifest: Codable {
        let platform: String
        let captures: [Capture]
        let fonts: [FontMetrics]
    }

    private struct RoleSpecimen {
        let id: String
        let style: TBTextStyle
        let postScriptName: String
        let baseSize: CGFloat
        let text: String
    }

    private struct Fixture {
        let id: String
        let kind: Kind
        let category: Category
        let content: @MainActor () -> AnyView
    }

    private enum CaptureError: LocalizedError {
        case foregroundSceneUnavailable
        case fontUnavailable(String)
        case invalidFittingSize(String)
        case imageUnavailable(String)

        var errorDescription: String? {
            switch self {
            case .foregroundSceneUnavailable:
                "No foreground UIWindowScene became available for typography capture."
            case let .fontUnavailable(name):
                "Required bundled font is unavailable: \(name)."
            case let .invalidFittingSize(id):
                "Typography fixture did not produce a finite positive height: \(id)."
            case let .imageUnavailable(id):
                "Could not render the typography fixture as PNG: \(id)."
            }
        }
    }

    private static var isExporting = false
    private static let captureWidth: CGFloat = 390

    private static let roles: [RoleSpecimen] = [
        .init(id: "sectionTitle", style: .sectionTitle, postScriptName: "Pretendard-Bold", baseSize: 18, text: "기록한 식사의 발견"),
        .init(id: "subsectionTitle", style: .subsectionTitle, postScriptName: "Pretendard-Bold", baseSize: 16, text: "기억에 남는 감각"),
        .init(id: "sheetTitle", style: .sheetTitle, postScriptName: "Pretendard-Bold", baseSize: 15, text: "식사 당시의 조건"),
        .init(id: "body", style: .body, postScriptName: "Pretendard-Regular", baseSize: 14, text: "식사에서 느낀 감각과 좋아하는 정도를 따로 기록해요."),
        .init(id: "caption", style: .caption, postScriptName: "Pretendard-SemiBold", baseSize: 12, text: "직접 남긴 식사 기록을 바탕으로 살펴봐요."),
        .init(id: "detailAction", style: .detailAction, postScriptName: "Pretendard-Medium", baseSize: 11, text: "기록 자세히 보기"),
    ]

    static func export() async {
        guard !isExporting else { return }
        isExporting = true
        defer { isExporting = false }

        let fileManager = FileManager.default
        let folder = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("plating-typography", isDirectory: true)

        do {
            // This dedicated export folder contains only generated documentation output.
            if fileManager.fileExists(atPath: folder.path) {
                try fileManager.removeItem(at: folder)
            }
            try fileManager.createDirectory(at: folder, withIntermediateDirectories: true)

            let scene = try await foregroundScene()
            let fonts = try roles.map { try fontMetrics($0) }
            var captures: [Capture] = []
            for fixture in fixtures {
                try Task.checkCancellation()
                captures.append(try await capture(fixture, in: scene, folder: folder))
            }

            let manifest = Manifest(platform: "iOS · SwiftUI", captures: captures, fonts: fonts)
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            try encoder.encode(manifest).write(to: folder.appendingPathComponent("manifest.json"), options: .atomic)
            try Data("complete\n".utf8).write(to: folder.appendingPathComponent("complete.txt"), options: .atomic)
        } catch {
            try? fileManager.createDirectory(at: folder, withIntermediateDirectories: true)
            try? Data("\(error.localizedDescription)\n".utf8)
                .write(to: folder.appendingPathComponent("error.txt"), options: .atomic)
        }
    }

    private static func foregroundScene() async throws -> UIWindowScene {
        for _ in 0..<60 {
            if let scene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first(where: { $0.activationState == .foregroundActive }) {
                return scene
            }
            try await Task.sleep(for: .milliseconds(100))
        }
        throw CaptureError.foregroundSceneUnavailable
    }

    private static func fontMetrics(_ role: RoleSpecimen) throws -> FontMetrics {
        guard let font = UIFont(name: role.postScriptName, size: role.baseSize),
              font.fontName == role.postScriptName else {
            throw CaptureError.fontUnavailable(role.postScriptName)
        }
        return FontMetrics(
            role: role.id,
            postScriptName: font.fontName,
            familyName: font.familyName,
            baseSize: Double(font.pointSize),
            lineHeight: Double(font.lineHeight),
            ascender: Double(font.ascender),
            descender: Double(font.descender),
            capHeight: Double(font.capHeight)
        )
    }

    private static func capture(_ fixture: Fixture, in scene: UIWindowScene, folder: URL) async throws -> Capture {
        let content = VStack(alignment: .leading, spacing: 16) {
            fixture.content()
        }
        .padding(20)
        .frame(width: captureWidth, alignment: .leading)
        .fixedSize(horizontal: false, vertical: true)
        .background(TBColor.page)
        .environment(\.dynamicTypeSize, fixture.category.dynamicTypeSize)
        .environment(\.colorScheme, .light)
        .ignoresSafeArea()

        let host = UIHostingController(rootView: content)
        host.overrideUserInterfaceStyle = .light
        host.traitOverrides.preferredContentSizeCategory = UIContentSizeCategory(fixture.category.dynamicTypeSize)
        let fittingSize = host.sizeThatFits(in: CGSize(width: captureWidth, height: .greatestFiniteMagnitude))
        guard fittingSize.height.isFinite, fittingSize.height > 0 else {
            throw CaptureError.invalidFittingSize(fixture.id)
        }
        let height = ceil(fittingSize.height)
        let bounds = CGRect(x: 0, y: 0, width: captureWidth, height: height)
        let window = UIWindow(windowScene: scene)
        defer {
            window.isHidden = true
            window.rootViewController = nil
        }
        window.frame = bounds
        window.windowLevel = .normal + 1
        window.rootViewController = host
        window.isHidden = false
        host.view.frame = window.bounds
        host.view.setNeedsLayout()
        host.view.layoutIfNeeded()
        try await Task.sleep(for: .milliseconds(180))

        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let renderer = UIGraphicsImageRenderer(bounds: window.bounds, format: format)
        var rendered = false
        let image = renderer.image { _ in
            rendered = host.view.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        guard rendered, let data = image.pngData() else {
            throw CaptureError.imageUnavailable(fixture.id)
        }
        let filename = "\(fixture.id).png"
        try data.write(to: folder.appendingPathComponent(filename), options: .atomic)
        return Capture(id: fixture.id, kind: fixture.kind, category: fixture.category, file: filename,
                       width: Double(captureWidth), height: Double(height))
    }

    private static var fixtures: [Fixture] {
        let roleFixtures = roles.map { role in
            Fixture(id: "role-\(role.id)", kind: .role, category: .large) {
                AnyView(Text(role.text).tbTextStyle(role.style).frame(maxWidth: .infinity, alignment: .leading))
            }
        }
        let dynamicFixtures = Category.allCases.map { category in
            Fixture(id: "dynamic-\(category.rawValue)", kind: .dynamic, category: category) {
                AnyView(dynamicComposition)
            }
        }
        return roleFixtures + dynamicFixtures + [
            Fixture(id: "usage-home", kind: .usage, category: .large) { AnyView(homeComposition) },
            Fixture(id: "usage-dining", kind: .usage, category: .large) { AnyView(diningComposition) },
            Fixture(id: "usage-analysis", kind: .usage, category: .large) { AnyView(analysisComposition) },
        ]
    }

    /// The same synthetic content at each requested Dynamic Type category.
    private static var dynamicComposition: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("오랜만에 다시 먹은 메뉴에서 기억에 남는 감각을 자세히 남겨 보세요")
                .tbTextStyle(.subsectionTitle)
            Text("따뜻한 국물과 부드러운 면을 천천히 먹었어요. 평소보다 늦은 저녁이었고, 함께 식사한 사람과 이야기를 나누며 먹었습니다. 음식에서 느낀 감각과 좋아하는 정도, 식사 당시의 조건을 따로 기록해요.")
                .tbTextStyle(.body)
            Text("문서용 합성 예제 · 실제 식사 기록이나 취향 분석 결과가 아니에요.")
                .tbTextStyle(.caption)
            PrimaryButton(title: "감각과 좋아하는 정도를 기록하고 다음 단계로 이동하기", action: {})
        }
    }

    /// Font recipes from HomeSummaryCard and RecommendationMiniCardTextLayout; synthetic copy.
    private static var homeComposition: some View {
        let axis = TasteAxis.sweet
        return VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text("최근에 자주 기록한 감각")
                    .font(TBFont.bold(14))
                    .foregroundStyle(axis.tintTextColor)
                    .lineLimit(1)
                    .truncationMode(.tail)
                Text("고소한 향 · 부드러운 질감")
                    .font(TBFont.semibold(14))
                    .foregroundStyle(axis.tintSubTextColor)
                    .lineLimit(1)
                    .truncationMode(.tail)
            }
            Text("미식 데이터 보기")
                .font(TBFont.regular(10))
                .foregroundStyle(axis.tintTextColor)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(axis.tintSurfaceColor)
        .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
    }

    /// DiningFeedbackIntroHeader font recipes with a real PrimaryButton; synthetic body copy.
    private static var diningComposition: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("어떤 메뉴를 먼저 기록할까요?")
                    .font(TBFont.bold(18))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineSpacing(2)
                VStack(alignment: .leading, spacing: 8) {
                    Text("기억에 남는 메뉴를 먼저 골라 주세요. 메뉴마다 감각과 좋아하는 정도를 따로 기록할 수 있어요.")
                        .font(TBFont.regular(14))
                        .foregroundStyle(TBColor.textBody)
                        .lineSpacing(5)
                    Text("식사 당시의 상황을 함께 남겨요.")
                        .font(TBFont.regular(12))
                        .foregroundStyle(TBColor.textHint)
                        .lineSpacing(4)
                }
            }
            PrimaryButton(title: "취향까지 기록", action: {})
        }
    }

    /// TasteQuestionStackCard font recipes without its data state or fixed product geometry.
    private static var analysisComposition: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("기록에서 살펴보기")
                    .font(TBFont.medium(11))
                    .foregroundStyle(TBColor.textSecondary)
                Text("같은 메뉴를 다시 먹고 싶은 이유는 무엇인가요?")
                    .font(TBFont.semibold(14))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineLimit(2)
                Text("실제로 남긴 기록을 바탕으로 살펴봐요.")
                    .font(TBFont.regular(11))
                    .foregroundStyle(TBColor.textHint)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            }
            HStack(spacing: 8) {
                ForEach(Array(["익숙한 맛", "편안한 식사", "새로운 감각"].enumerated()), id: \.offset) { index, label in
                    Text(label)
                        .font(TBFont.semibold(11))
                        .foregroundStyle(index == 0 ? TBColor.selectionText : TBColor.textSecondary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity)
                        .background(index == 0 ? TBColor.selectionSurface : TBColor.mutedSurface)
                        .clipShape(RoundedRectangle(cornerRadius: TBRadius.control, style: .continuous))
                }
            }
        }
    }
}
#endif
