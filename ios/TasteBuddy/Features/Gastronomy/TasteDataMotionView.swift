import SwiftUI
import JavaScriptCore

struct TDCategoryMotionFrame: Decodable, Sendable {
    struct Dot: Decodable, Sendable {
        let id: String; let x: Double; let y: Double; let r: Double
        let color: String; let opacity: Double; let tintColor: String?; let tint: Double?
    }
    struct Point: Decodable, Sendable { let x: Double; let y: Double }
    struct Bridge: Decodable, Sendable { let points: [Point]; let color: String; let opacity: Double }
    let dots: [Dot]
    let bridges: [Bridge]?
    let title: String; let value: String; let unit: String; let state: String
    let notes: [String]; let summaryOpacity: Double
}
struct TDCategoryMotionRequest: Equatable, Sendable {
    let tick: Int
    let playback: String
    let alignment: Double
    let rotation: Double
    var page = 0
    var rotationTime: Double? = nil
    var time: Double { Double(tick) / 30 }
    var json: String {
        var options: [String: Any] = ["playback": playback, "alignment": alignment, "rotation": rotation, "page": page]
        if let rotationTime { options["rotationTime"] = rotationTime }
        let data = try? JSONSerialization.data(withJSONObject: options)
        return data.flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
    }
}

/// All JavaScriptCore access is confined to this serial queue, away from the UI thread.
final class TDCategoryMotionWorker: @unchecked Sendable {
    private let queue = DispatchQueue(label: "com.tastebuddy.category-motion", qos: .userInitiated)
    private var context: JSContext?
    private var configured: String?
    private var scriptError: String?

    func frame(input: TDCategoryMotionInput, request: TDCategoryMotionRequest) async throws -> TDCategoryMotionFrame {
        try await withCheckedThrowingContinuation { continuation in
            queue.async { [self] in
                do {
                    if context == nil {
                        guard let url = Bundle.main.url(forResource: "TasteDataCategoryMotion", withExtension: "js", subdirectory: "CategoryMotion")
                                ?? Bundle.main.url(forResource: "TasteDataCategoryMotion", withExtension: "js"),
                              let engine = JSContext() else { throw CocoaError(.fileReadNoSuchFile) }
                        engine.exceptionHandler = { [weak self] _, error in self?.scriptError = error?.toString() }
                        context = engine
                        scriptError = nil
                        engine.evaluateScript(try String(contentsOf: url, encoding: .utf8))
                        if scriptError != nil { throw CocoaError(.fileReadCorruptFile) }
                    }
                    guard let api = context?.objectForKeyedSubscript("TasteBuddyCategoryMotion") else { throw CocoaError(.fileReadCorruptFile) }
                    scriptError = nil
                    if configured != input.json {
                        api.invokeMethod("configure", withArguments: [input.json])
                        configured = input.json
                    }
                    let value = api.invokeMethod("frame", withArguments: [request.time, request.json])
                    guard scriptError == nil, let json = value?.toString(), let data = json.data(using: .utf8) else { throw CocoaError(.fileReadCorruptFile) }
                    let frame = try JSONDecoder().decode(TDCategoryMotionFrame.self, from: data)
                    guard frame.dots.allSatisfy({ $0.x.isFinite && $0.y.isFinite && $0.r.isFinite && $0.opacity.isFinite }) else { throw CocoaError(.fileReadCorruptFile) }
                    continuation.resume(returning: frame)
                } catch { configured = nil; continuation.resume(throwing: error) }
            }
        }
    }
}

@MainActor final class TDCategoryMotionPlayer: ObservableObject {
    @Published var frame: TDCategoryMotionFrame?
    @Published var readyAt: Date?
    @Published var failed = false
    private let worker = TDCategoryMotionWorker()
    private var pending: (TDCategoryMotionInput, TDCategoryMotionRequest)?
    private var running = false
    private var inputJSON: String?
    private var generation = 0

    /// Coalesce updates rather than queueing stale frames when a device is busy.
    func request(input: TDCategoryMotionInput, request: TDCategoryMotionRequest) {
        if inputJSON != input.json {
            generation += 1; inputJSON = input.json; frame = nil; readyAt = nil; failed = false
        }
        pending = (input, request)
        guard !running else { return }
        running = true
        Task {
            while let next = pending {
                pending = nil
                let token = generation
                do {
                    let output = try await worker.frame(input: next.0, request: next.1)
                    guard token == generation else { continue }
                    frame = output; failed = false
                    if readyAt == nil { readyAt = Date() }
                } catch { if token == generation { failed = true } }
            }
            running = false
        }
    }
    func suspend() { pending = nil; generation += 1 }
}

struct TDCategoryMotionView: View {
    let input: TDCategoryMotionInput
    let reduceMotion: Bool
    let collapseProgress: Double
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var player = TDCategoryMotionPlayer()
    @State private var visible = false
    @State private var page = 0
    @State private var interaction = TasteMotionGeometry.InsightInteraction()
    @State private var rotation = TasteMotionGeometry.InsightRotation()
    private var interactive: Bool { input.category == .preference || input.category == .sensation || input.category == .experience }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30, paused: reduceMotion || !visible || scenePhase != .active || collapseProgress > 0)) { timeline in
            let elapsed = max(0, player.readyAt.map { timeline.date.timeIntervalSince($0) } ?? 0)
            let t = collapseProgress > 0 ? input.introDuration * (1 - collapseProgress) : elapsed
            let request = TDCategoryMotionRequest(tick: max(0, Int((t * 30).rounded(.down))),
                                                  playback: reduceMotion ? "reduced" : collapseProgress > 0 ? "intro" : input.playback,
                                                  alignment: reduceMotion ? interaction.target : interaction.value(at: timeline.date),
                                                  rotation: rotation.value(at: timeline.date), page: page,
                                                  rotationTime: input.category == .experience ? max(0, elapsed - input.introDuration) : nil)
            GeometryReader { proxy in
                ZStack {
                    Canvas { context, size in
                        guard let frame = player.frame else { return }
                        let side = min(size.width, size.height)
                        context.translateBy(x: (size.width-side)/2, y: (size.height-side)/2)
                        context.scaleBy(x: side/640, y: side/640)
                        for bridge in frame.bridges ?? [] where bridge.points.count == 8 {
                            let p = bridge.points.map { CGPoint(x: $0.x, y: $0.y) }
                            var path = Path(); path.move(to: p[0]); path.addCurve(to: p[3], control1: p[1], control2: p[2])
                            path.addLine(to: p[4]); path.addCurve(to: p[7], control1: p[5], control2: p[6]); path.closeSubpath()
                            context.fill(path, with: .color(Self.color(bridge.color, mode: TBColorMode(colorScheme)).opacity(bridge.opacity)))
                        }
                        for dot in frame.dots {
                            context.fill(Path(ellipseIn: CGRect(x: dot.x-dot.r, y: dot.y-dot.r, width: dot.r*2, height: dot.r*2)),
                                         with: .color(Self.color(dot.color, tint: dot.tintColor, amount: dot.tint ?? 0, mode: TBColorMode(colorScheme)).opacity(dot.opacity)))
                        }
                    }.accessibilityHidden(true)
                    if let frame = player.frame {
                        VStack(spacing: 5) {
                            Text(frame.title).font(TBFont.medium(12)).foregroundStyle(TBColor.textBody).lineLimit(2)
                            // TBFont caps general UI text at 18pt; only the central metric uses a larger size.
                            Text(frame.value).font(.custom("Pretendard-Bold", size: frame.value.count > 6 ? 20 : 22)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.55)
                                .foregroundStyle(TBColor.textPrimary)
                            Text(input.pageCount > 1 ? (frame.notes.first { $0.contains("생략") } ?? frame.unit) : frame.unit).font(TBFont.medium(12)).foregroundStyle(TBColor.textBody).lineLimit(2)
                            if frame.state != "valid", let status = frame.notes.first {
                                Text(status).font(TBFont.regular(11)).foregroundStyle(TBColor.textHint).lineLimit(2)
                            }
                        }
                        .multilineTextAlignment(.center).frame(width: proxy.size.width * 0.37)
                        .opacity(frame.summaryOpacity)
                        .accessibilityIdentifier("taste-data-motion-summary-" + input.category.id)
                    } else {
                        Text(player.failed ? "표시를 준비하지 못했어요" : "준비 중")
                            .font(TBFont.medium(12)).foregroundStyle(TBColor.textHint)
                    }
                }
                .contentShape(Circle())
                .simultaneousGesture(DragGesture(minimumDistance: 6).onChanged { value in
                    guard interactive, collapseProgress == 0, input.category != .experience || reduceMotion || elapsed >= input.introDuration else { return }
                    rotation.size = proxy.size
                    rotation.drag(to: value.location, at: value.time)
                }.onEnded { value in
                    guard interactive else { return }
                    rotation.end(at: value.time, immediate: reduceMotion)
                })
                .onTapGesture {
                    if input.category == .context && input.pageCount > 1 { page = (page + 1) % input.pageCount }
                    else if input.category == .preference { interaction.setPressed(interaction.target == 0, at: Date()) }
                }
            }
            .onChange(of: request, initial: true) { _, next in player.request(input: input, request: next) }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(player.frame.map { $0.title + " · " + $0.value + " " + $0.unit } ?? "집계 중")
        .accessibilityValue(input.category.id + " 모션")
        .accessibilityHint(input.pageCount > 1 ? "탭하여 다음 조건을 비교합니다" : interactive ? "드래그하여 링을 회전합니다" : "")
        .accessibilityIdentifier("taste-data-motion-" + input.category.id)
        .onAppear { visible = true }
        .onDisappear { visible = false; player.suspend() }
    }
    static func color(_ hex: String, tint: String? = nil, amount: Double = 0, mode: TBColorMode = .light) -> Color {
        let value = UInt64(TBTasteMotionColor.hex(hex, in: mode).dropFirst(), radix: 16) ?? 0x95867A
        let target = tint.flatMap { UInt64(TBTasteMotionColor.hex($0, in: mode).dropFirst(), radix: 16) } ?? value
        let t = min(1,max(0,amount))
        func channel(_ shift: Int) -> Double { let a = Double((value >> shift)&255), b = Double((target >> shift)&255); return (a+(b-a)*t)/255 }
        return Color(red: channel(16), green: channel(8), blue: channel(0))
    }
}
