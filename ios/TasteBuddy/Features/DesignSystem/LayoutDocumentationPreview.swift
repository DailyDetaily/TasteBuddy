import SwiftUI

/// The regular app keeps its existing model factory; only an explicit DEBUG flag uses fixtures.
enum LayoutDocumentationRuntime {
    static var isEnabled: Bool {
        #if DEBUG
        ProcessInfo.processInfo.arguments.contains("--plating-layout-preview")
        #else
        false
        #endif
    }

    @MainActor
    static func makeAppModel() -> AppModel {
        #if DEBUG
        if isEnabled {
            return AppModel.preview(
                authEntryComplete: true,
                onboardingComplete: true,
                profile: .sample,
                diningEntries: LayoutDocumentationConfiguration.screen == .home
                    ? LayoutDocumentationFixtures.homeEntries : [],
                dishFeedbackComments: [:],
                sessionRepository: FixtureBackendSessionRepository(status: .signedOut),
                authRepository: FixtureBackendAuthRepository(),
                publicProfileRepository: FixtureBackendPublicProfileRepository(identities: []),
                accountDataRepository: UnavailableNativeAccountDataRepository(),
                accountPhotoRepository: UnavailableNativeAccountPhotoRepository(),
                chatGPTExportRepository: LayoutDocumentationExportRepository(),
                now: { LayoutDocumentationFixtures.referenceDate }
            )
        }
        #endif
        return BrandVideoCaptureRuntime.makeAppModel()
    }
}

extension View {
    /// A background-only observer. Release builds and ordinary launches return the original view.
    @MainActor
    @ViewBuilder
    func platingLayoutFrame(_ id: String, when condition: Bool = true) -> some View {
        #if DEBUG
        if LayoutDocumentationRuntime.isEnabled, condition,
           LayoutDocumentationConfiguration.requiredFrames.contains(id) {
            background {
                GeometryReader { geometry in
                    LayoutDocumentationFrameProbe(id: id, frameInGlobal: geometry.frame(in: .global))
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }
            }
        } else {
            self
        }
        #else
        self
        #endif
    }
}

#if DEBUG
import Combine
import UIKit

private enum LayoutDocumentationConfiguration {
    enum Screen: String {
        case home, dining, sheet
    }

    static let requestedScreen = argument(after: "--plating-layout-screen") ?? "home"
    static let requestedSize = argument(after: "--plating-layout-size") ?? "large"
    static let screen = Screen(rawValue: requestedScreen)
    static let requestsKeyboard = ProcessInfo.processInfo.arguments.contains("--plating-layout-keyboard")

    static var dynamicTypeSize: DynamicTypeSize {
        requestedSize == "accessibility2" ? .accessibility2 : .large
    }

    static var id: String {
        let prefix = screen?.rawValue ?? "invalid"
        if requestsKeyboard {
            return prefix + (requestedSize == "accessibility2" ? "-accessibility2-keyboard" : "-keyboard")
        }
        return prefix + "-" + (requestedSize == "accessibility2" ? "accessibility2" : "large")
    }

    static var validationError: String? {
        if screen == nil { return "Unsupported layout screen: \(requestedScreen)" }
        if !["large", "accessibility2"].contains(requestedSize) {
            return "Unsupported Dynamic Type size: \(requestedSize)"
        }
        if requestsKeyboard, screen != .sheet {
            return "The keyboard capture requires the account-link sheet."
        }
        return nil
    }

    static var requiredFrames: Set<String> {
        switch screen {
        case .home:
            ["top-bar", "content", "bottom-tab", "home-card", "home-card-content", "home-section"]
        case .dining:
            ["dining-header", "dining-content", "dining-footer"]
        case .sheet:
            ["sheet-header", "sheet-content", "sheet-footer", "sheet-input", "auth-primary-action"]
        case nil:
            []
        }
    }

    static var source: String {
        switch screen {
        case .home: "ios/TasteBuddy/Components/Shell/AppShellView.swift → HomeView"
        case .dining: "ios/TasteBuddy/Features/Dining/DiningView.swift → DiningFeedbackSheet.menu"
        case .sheet: "ios/TasteBuddy/Components/Shell/AppShellView.swift → staged AuthEntrySheet.linkCurrentProfile"
        case nil: "invalid"
        }
    }

    private static func argument(after flag: String) -> String? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: flag), arguments.indices.contains(index + 1) else { return nil }
        return arguments[index + 1]
    }
}

/// Hosts production screens with isolated preview data; no substitute screen or keyboard is drawn.
@MainActor
struct LayoutDocumentationPreview: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        Group {
            switch LayoutDocumentationConfiguration.screen {
            case .home:
                AppShellView(initialTab: .home)
            case .dining:
                if let entry = try? LayoutDocumentationFixtures.diningEntry() {
                    DiningFeedbackSheet(entry: entry, startMode: .menu, onClose: {}, onSave: { _ in })
                } else {
                    Color.clear
                }
            case .sheet:
                AppShellView(initialSheet: .authEntry(.linkCurrentProfile))
            case nil:
                TBColor.page.ignoresSafeArea()
            }
        }
        .environment(\.dynamicTypeSize, LayoutDocumentationConfiguration.dynamicTypeSize)
        .environment(\.colorScheme, .light)
        .preferredColorScheme(.light)
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardDidShowNotification)) {
            LayoutDocumentationRecorder.shared.keyboardDidShow($0)
        }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardDidChangeFrameNotification)) {
            LayoutDocumentationRecorder.shared.keyboardDidChangeFrame($0)
        }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardDidHideNotification)) { _ in
            LayoutDocumentationRecorder.shared.keyboardDidHide()
        }
        .task {
            let recorder = LayoutDocumentationRecorder.shared
            recorder.begin()
            if let error = LayoutDocumentationConfiguration.validationError {
                recorder.finish(error: error)
                return
            }
            if LayoutDocumentationConfiguration.screen == .dining {
                do { _ = try LayoutDocumentationFixtures.diningEntry() }
                catch {
                    recorder.finish(error: error.localizedDescription)
                    return
                }
            }
            var didRequestKeyboard = false
            do {
                for _ in 0..<200 {
                    try Task.checkCancellation()
                    guard let window = recorder.captureWindow else {
                        try await Task.sleep(for: .milliseconds(100))
                        continue
                    }
                    window.rootViewController?.traitOverrides.preferredContentSizeCategory =
                        UIContentSizeCategory(LayoutDocumentationConfiguration.dynamicTypeSize)
                    recorder.refreshFrames()

                    if LayoutDocumentationConfiguration.screen == .sheet,
                       let field = recorder.emailField {
                        if LayoutDocumentationConfiguration.requestsKeyboard, !didRequestKeyboard,
                           field.window != nil, field.isEnabled,
                           recorder.isLayoutStable {
                            didRequestKeyboard = field.becomeFirstResponder()
                        }
                    }

                    let analysisReady = LayoutDocumentationConfiguration.screen != .home || !model.sensoryAnalysisIsUpdating
                    if analysisReady, LayoutDocumentationConfiguration.screen == .home,
                       let error = model.sensoryAnalysisError {
                        recorder.finish(error: error)
                        return
                    }
                    if analysisReady, recorder.isReady {
                        recorder.finish()
                        return
                    }
                    try await Task.sleep(for: .milliseconds(100))
                }
                let missing = LayoutDocumentationConfiguration.requiredFrames.subtracting(recorder.frameIDs).sorted()
                recorder.finish(error: "Layout did not settle. Missing frames: \(missing.joined(separator: ", ")). Keyboard shown: \(recorder.keyboardVisible).")
            } catch {
                recorder.finish(error: error.localizedDescription)
            }
        }
    }
}

private enum LayoutDocumentationFixtures {
    static let referenceDate = Date(timeIntervalSince1970: 1_788_480_000 + 7 * 86_400)

    // Synthetic direct observations matching the existing native analysis preview contract.
    static let homeEntries: [DiningEntry] = (0..<7).map { index in
        let id = UUID(uuidString: String(format: "D1000000-0000-0000-0000-%012d", index + 1))!
        let observed = Date(timeIntervalSince1970: 1_788_480_000 + Double(index * 86_400))
        return DiningEntry(
            id: id, mealID: id,
            restaurant: "국물의 산미 기록", menu: index < 3 ? "중간 산미의 국물" : "진한 산미의 국물",
            observedAt: observed, savedAt: observed.addingTimeInterval(600), rating: 0, note: "",
            tasteExperienceIDs: ["sour-fresh"],
            sensorySelections: [.init(id: "sour-fresh", type: .bubble, labelSnapshot: "산뜻한 산미",
                liking: index < 3 ? .liked : .disliked,
                intensity: index == 6 ? nil : index < 3 ? .medium : .strong,
                preferenceFit: index < 3 ? .justRight : .tooStrong, target: .broth, phase: .duringMeal)],
            overallEvaluation: .init(response: .veryLiked), dishKindIDs: ["broth"]
        )
    }

    static func diningEntry() throws -> DiningEntry {
        let scenario = try DiningFeedbackFixtureLoader.load().scenario
        guard let dish = scenario.dishes.first else {
            throw NSError(domain: "PlatingLayout", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "The bundled dining scenario has no menu."])
        }
        return DiningEntry(
            id: UUID(uuidString: "D2000000-0000-0000-0000-000000000001")!,
            restaurant: scenario.restaurant, menu: dish.title, date: referenceDate,
            rating: 0, note: "", sensorySelections: [], feedbackStatus: .completed
        )
    }
}

private struct LayoutDocumentationExportRepository: ChatGPTExportRepository {
    func account() async throws -> ChatGPTAnalysisAccount {
        throw ChatGPTAnalysisConnectionError.unavailable
    }

    func publish(_ payload: ChatGPTAnalysisExport, account: ChatGPTAnalysisAccount) async throws {
        throw ChatGPTAnalysisConnectionError.unavailable
    }

    func removeExport(account: ChatGPTAnalysisAccount, sourceFingerprint: String?) async throws {
        throw ChatGPTAnalysisConnectionError.unavailable
    }
}

/// GeometryReader supplies each SwiftUI frame; the transparent UIKit anchor normalizes
/// presentation-local global coordinates into the real app window's coordinate space.
@MainActor
private struct LayoutDocumentationFrameProbe: UIViewRepresentable {
    let id: String
    let frameInGlobal: CGRect

    func makeUIView(context: Context) -> LayoutDocumentationFrameAnchor {
        let view = LayoutDocumentationFrameAnchor()
        view.isUserInteractionEnabled = false
        view.backgroundColor = .clear
        return view
    }

    func updateUIView(_ view: LayoutDocumentationFrameAnchor, context: Context) {
        view.captureID = id
        view.frameInGlobal = frameInGlobal
        LayoutDocumentationRecorder.shared.register(view)
        view.setNeedsLayout()
    }
}

@MainActor
private final class LayoutDocumentationFrameAnchor: UIView {
    var captureID = ""
    var frameInGlobal = CGRect.zero

    override func layoutSubviews() {
        super.layoutSubviews()
        reportFrame()
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        reportFrame()
    }

    func reportFrame() {
        guard let window, let target = LayoutDocumentationRecorder.shared.captureWindow,
              window === target, frameInGlobal.width > 0, frameInGlobal.height > 0 else { return }
        let frameInWindow = convert(bounds, to: target)
        LayoutDocumentationRecorder.shared.record(captureID, frame: frameInWindow)
    }
}

@MainActor
private final class LayoutDocumentationRecorder {
    static let shared = LayoutDocumentationRecorder()

    private struct Rect: Codable {
        let x: Double
        let y: Double
        let width: Double
        let height: Double

        init(_ frame: CGRect) {
            x = Double(frame.minX)
            y = Double(frame.minY)
            width = Double(frame.width)
            height = Double(frame.height)
        }
    }

    private struct Insets: Codable {
        let top: Double
        let right: Double
        let bottom: Double
        let left: Double

        init(_ insets: UIEdgeInsets) {
            top = Double(insets.top)
            right = Double(insets.right)
            bottom = Double(insets.bottom)
            left = Double(insets.left)
        }
    }

    private struct Metadata: Encodable {
        let schemaVersion = 1
        let id: String
        let screen: String
        let dynamicType: String
        let keyboardVisible: Bool
        let status: String
        let source: String
        let width: Double
        let height: Double
        let safeArea: Insets
        let frames: [String: Rect]
        let keyboardFrame: Rect?
        let error: String?
    }

    private final class WeakAnchor {
        weak var value: LayoutDocumentationFrameAnchor?
        init(_ value: LayoutDocumentationFrameAnchor) { self.value = value }
    }

    private var anchors: [String: WeakAnchor] = [:]
    private var frames: [String: CGRect] = [:]
    private var lastFrameChange = Date.now
    private var keyboardShownAt: Date?
    private var keyboardFrame: CGRect?
    private var hasFinished = false
    private var isRecording = false

    var frameIDs: Set<String> { Set(frames.keys) }

    var captureWindow: UIWindow? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .filter { $0.activationState == .foregroundActive }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)
    }

    var emailField: UITextField? {
        guard let root = captureWindow?.rootViewController else { return nil }
        var presented = root
        while let next = presented.presentedViewController { presented = next }
        return findEmailField(in: presented.view)
    }

    var keyboardVisible: Bool {
        guard keyboardShownAt != nil, let keyboardFrame, let window = captureWindow else { return false }
        let overlap = window.bounds.intersection(keyboardFrame)
        return !overlap.isNull && overlap.width > 0 && overlap.height > 0
    }

    var isReady: Bool {
        guard isRecording, !hasFinished, captureWindow != nil,
              isLayoutStable else { return false }
        if LayoutDocumentationConfiguration.requestsKeyboard {
            guard keyboardVisible, let keyboardShownAt,
                  Date.now.timeIntervalSince(keyboardShownAt) >= 0.4 else { return false }
        }
        return true
    }

    var isLayoutStable: Bool {
        LayoutDocumentationConfiguration.requiredFrames.isSubset(of: frameIDs)
            && Date.now.timeIntervalSince(lastFrameChange) >= 0.5
    }

    func begin() {
        isRecording = true
        hasFinished = false
        frames.removeAll()
        keyboardFrame = nil
        keyboardShownAt = nil
        lastFrameChange = .now
        // Remove only this capture's previous generated metadata; preserve other captures.
        try? FileManager.default.removeItem(at: metadataURL)
    }

    func register(_ anchor: LayoutDocumentationFrameAnchor) {
        anchors[anchor.captureID] = WeakAnchor(anchor)
    }

    func refreshFrames() {
        for anchor in anchors.values { anchor.value?.reportFrame() }
    }

    func record(_ id: String, frame: CGRect) {
        guard isRecording, !hasFinished, LayoutDocumentationConfiguration.requiredFrames.contains(id),
              !frame.isNull, !frame.isInfinite, frame.width > 0, frame.height > 0 else { return }
        if let previous = frames[id], abs(previous.minX - frame.minX) < 0.25,
           abs(previous.minY - frame.minY) < 0.25, abs(previous.width - frame.width) < 0.25,
           abs(previous.height - frame.height) < 0.25 { return }
        frames[id] = frame
        lastFrameChange = .now
    }

    func keyboardDidShow(_ notification: Notification) {
        keyboardShownAt = .now
        keyboardDidChangeFrame(notification)
    }

    func keyboardDidChangeFrame(_ notification: Notification) {
        guard let window = captureWindow,
              let frame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect else { return }
        keyboardFrame = window.convert(frame, from: window.screen.coordinateSpace)
        lastFrameChange = .now
    }

    func keyboardDidHide() {
        keyboardFrame = nil
        keyboardShownAt = nil
        lastFrameChange = .now
    }

    func finish(error: String? = nil) {
        guard !hasFinished else { return }
        let window = captureWindow
        let metadata = Metadata(
            id: LayoutDocumentationConfiguration.id,
            screen: LayoutDocumentationConfiguration.requestedScreen,
            dynamicType: LayoutDocumentationConfiguration.requestedSize,
            keyboardVisible: keyboardVisible,
            status: error == nil ? "ready" : "error",
            source: LayoutDocumentationConfiguration.source,
            width: Double(window?.bounds.width ?? 0),
            height: Double(window?.bounds.height ?? 0),
            safeArea: Insets(window?.safeAreaInsets ?? .zero),
            frames: frames.mapValues(Rect.init),
            keyboardFrame: keyboardFrame.map(Rect.init),
            error: error
        )
        do {
            try FileManager.default.createDirectory(at: metadataURL.deletingLastPathComponent(), withIntermediateDirectories: true)
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            try encoder.encode(metadata).write(to: metadataURL, options: .atomic)
            hasFinished = true
            isRecording = false
        } catch {
            print("Could not write Plating layout metadata: \(error.localizedDescription)")
        }
    }

    private var metadataURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("plating-layout", isDirectory: true)
            .appendingPathComponent("\(LayoutDocumentationConfiguration.id).json")
    }

    private func findEmailField(in view: UIView) -> UITextField? {
        if let field = view as? UITextField, field.keyboardType == .emailAddress { return field }
        for child in view.subviews {
            if let field = findEmailField(in: child) { return field }
        }
        return nil
    }
}
#endif
