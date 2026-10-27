import SwiftUI
import UIKit


struct SplashView: View {
    var autoplays = true
    var onComplete: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hasCompleted = false

    var body: some View {
        ZStack {
            TBColor.page.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                TasteBuddySplashLogo(autoplays: autoplays && !reduceMotion, onComplete: completeIfNeeded)

                Spacer()

                Color.clear
                    .frame(height: TBSize.primaryButtonHeight)
            }
            .padding(.horizontal, TBSpacing.page)
            .padding(.bottom, max(12, bottomSafeAreaInset))
        }
        .ignoresSafeArea(edges: [.horizontal, .bottom])
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Taste Buddy 시작 화면")
        .accessibilityIdentifier("splash-screen")
        .task(id: reduceMotion) {
            guard autoplays else { return }
            do { try await Task.sleep(for: .seconds(reduceMotion ? 0.35 : 4)) }
            catch { return }
            completeIfNeeded()
        }
    }

    private var bottomSafeAreaInset: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets
            .bottom ?? 0
    }

    private func completeIfNeeded() {
        guard autoplays, !hasCompleted else { return }
        hasCompleted = true
        onComplete()
    }
}

private struct SplashVectorData: Decodable {
    struct Viewport: Decodable { let width, height, cropX, cropY, displayWidth, displayHeight: Double }
    struct Placement: Decodable { let x, y, scale: Double }
    struct Leaf: Decodable { let index: Int; let angle: Double; let d: String }
    struct Symbol: Decodable {
        let cx, cy, initialX, initialY, perspective, openFrames, moveStart, moveEnd: Double
        let leaves: [Leaf]
    }
    struct Glyph: Decodable { let index: Int; let d: String; let start, duration: Double; let masks: [String] }
    let viewport: Viewport
    let placement: Placement
    let symbol: Symbol
    let fps, durationFrames: Double
    let maskSteps: Int
    let glyphs: [Glyph]
}

private enum SplashPathError: Error { case invalid }
private enum SplashVectorPath {
    private static let pattern = try! NSRegularExpression(pattern: #"[MCLHVZlhv]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?"#)
    static func make(_ source: String) throws -> CGPath {
        let path = CGMutablePath()
        let text = source as NSString
        let tokens = pattern.matches(in: source, range: NSRange(location: 0, length: text.length))
            .map { text.substring(with: $0.range) }
        var i = 0, command = "M"
        var current = CGPoint.zero, start = CGPoint.zero
        func number() throws -> CGFloat {
            guard i < tokens.count, let value = Double(tokens[i]) else { throw SplashPathError.invalid }
            i += 1
            return CGFloat(value)
        }
        while i < tokens.count {
            if tokens[i].first?.isLetter == true { command = tokens[i]; i += 1 }
            switch command {
            case "M":
                current = CGPoint(x: try number(), y: try number()); start = current
                path.move(to: current); command = "L"
            case "L":
                current = CGPoint(x: try number(), y: try number()); path.addLine(to: current)
            case "l":
                current.x += try number(); current.y += try number(); path.addLine(to: current)
            case "h":
                current.x += try number(); path.addLine(to: current)
            case "v":
                current.y += try number(); path.addLine(to: current)
            case "H":
                current.x = try number(); path.addLine(to: current)
            case "V":
                current.y = try number(); path.addLine(to: current)
            case "C":
                let c1 = CGPoint(x: try number(), y: try number())
                let c2 = CGPoint(x: try number(), y: try number())
                current = CGPoint(x: try number(), y: try number())
                path.addCurve(to: current, control1: c1, control2: c2)
            case "Z":
                path.closeSubpath(); current = start; command = "M"
            default: throw SplashPathError.invalid
            }
        }
        return path
    }
}

@MainActor private final class SplashVectorModel {
    let data: SplashVectorData
    let leaves: [CGPath]
    let glyphs: [CGPath]
    let masks: [[CGPath]]
    init(data: SplashVectorData) throws {
        self.data = data
        leaves = try data.symbol.leaves.map { try SplashVectorPath.make($0.d) }
        glyphs = try data.glyphs.map { try SplashVectorPath.make($0.d) }
        masks = try data.glyphs.map { glyph in try glyph.masks.map { try SplashVectorPath.make($0) } }
    }
    static let shared: SplashVectorModel? = {
        guard let url = Bundle.main.url(forResource: "SplashLogoVector", withExtension: "json", subdirectory: "LogoSplash")
                ?? Bundle.main.url(forResource: "SplashLogoVector", withExtension: "json"),
              let bytes = try? Data(contentsOf: url),
              let data = try? JSONDecoder().decode(SplashVectorData.self, from: bytes) else { return nil }
        return try? SplashVectorModel(data: data)
    }()
}

private struct TasteBuddySplashLogo: View {
    let autoplays: Bool
    let onComplete: () -> Void
    var body: some View {
        Group {
            if let model = SplashVectorModel.shared {
                SplashVectorRenderer(model: model, autoplays: autoplays, onComplete: onComplete)
            } else {
                HStack(spacing: 16) {
                    Image("SplashSymbol").resizable().scaledToFit().frame(width: 64)
                    Image("SplashWordmark").resizable().scaledToFit().frame(width: 120)
                }
                .task {
                    guard autoplays else { return }
                    do { try await Task.sleep(for: .seconds(0.35)) } catch { return }
                    onComplete()
                }
            }
        }
        .frame(width: 220, height: 99)
        .accessibilityHidden(true)
    }
}

private struct SplashVectorRenderer: UIViewRepresentable {
    let model: SplashVectorModel
    let autoplays: Bool
    let onComplete: () -> Void
    func makeUIView(context: Context) -> SplashVectorView {
        let view = SplashVectorView(model: model)
        view.configure(autoplays: autoplays, onComplete: onComplete)
        return view
    }
    func updateUIView(_ view: SplashVectorView, context: Context) {
        view.configure(autoplays: autoplays, onComplete: onComplete)
    }
    static func dismantleUIView(_ view: SplashVectorView, coordinator: ()) { view.stop() }
}

@MainActor private final class SplashVectorTick: NSObject {
    weak var owner: SplashVectorView?
    init(owner: SplashVectorView) { self.owner = owner }
    @objc func tick(_ link: CADisplayLink) { owner?.tick(link) }
}

private final class SplashVectorView: UIView {
    private let model: SplashVectorModel
    private let petalRoot = CALayer(), wordRoot = CALayer()
    private var petals: [CAShapeLayer] = [], glyphs: [CAShapeLayer] = [], masks: [CAShapeLayer] = []
    private var steps: [Int] = []
    private var displayLink: CADisplayLink?
    private lazy var target = SplashVectorTick(owner: self)
    private var startedAt: CFTimeInterval = 0
    private var elapsed = 0.0, configured = false, autoplays = false, completed = false
    private var onComplete: () -> Void = {}

    init(model: SplashVectorModel) {
        self.model = model
        super.init(frame: .zero)
        backgroundColor = .clear; isOpaque = false; clipsToBounds = true
        isUserInteractionEnabled = false
        let plane = CGRect(x: 0, y: 0, width: 1000, height: 500)
        for root in [petalRoot, wordRoot] {
            root.bounds = plane; root.anchorPoint = .zero; layer.addSublayer(root)
        }
        for path in model.leaves {
            let leaf = CAShapeLayer()
            leaf.bounds = plane
            leaf.anchorPoint = CGPoint(x: model.data.symbol.cx / 1000, y: model.data.symbol.cy / 500)
            leaf.position = CGPoint(x: model.data.symbol.cx, y: model.data.symbol.cy)
            leaf.path = path; leaf.fillColor = UIColor(TBColor.textPrimary).cgColor
            petalRoot.addSublayer(leaf); petals.append(leaf)
        }
        for path in model.glyphs {
            let glyph = CAShapeLayer(), mask = CAShapeLayer()
            glyph.frame = plane; glyph.path = path; glyph.fillColor = UIColor(TBColor.textPrimary).cgColor
            mask.frame = plane; mask.fillColor = UIColor.white.cgColor; mask.fillRule = .evenOdd
            wordRoot.addSublayer(glyph); glyphs.append(glyph); masks.append(mask); steps.append(-1)
        }
    }
    required init?(coder: NSCoder) { return nil }

    func configure(autoplays: Bool, onComplete: @escaping () -> Void) {
        self.onComplete = onComplete
        guard !configured || self.autoplays != autoplays else { return }
        configured = true; self.autoplays = autoplays; completed = false
        stop()
        elapsed = autoplays ? 0 : model.data.durationFrames / model.data.fps
        render()
        if window != nil && autoplays { start() }
    }
    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window == nil { stop() }
        else if autoplays && !completed { start() }
    }
    override func layoutSubviews() { super.layoutSubviews(); render() }
    private func start() {
        guard displayLink == nil else { return }
        startedAt = CACurrentMediaTime() - elapsed
        let link = CADisplayLink(target: target, selector: #selector(SplashVectorTick.tick(_:)))
        link.add(to: .main, forMode: .common); displayLink = link
    }
    func stop() { displayLink?.invalidate(); displayLink = nil }
    func tick(_ link: CADisplayLink) {
        let duration = model.data.durationFrames / model.data.fps
        elapsed = min(duration, max(0, link.timestamp - startedAt))
        render()
        if elapsed >= duration && !completed {
            completed = true; stop(); onComplete()
        }
    }
    private func ease(_ value: Double) -> Double {
        let t = min(1, max(0, value)); return t * t * (3 - 2 * t)
    }
    private func render() {
        guard bounds.width > 0 else { return }
        let d = model.data, s = d.symbol, p = d.placement
        let scale = Double(bounds.width) / d.viewport.width
        let frame = elapsed * d.fps
        let remaining = 1 - ease((frame - s.moveStart) / (s.moveEnd - s.moveStart))
        let offsetX = (s.initialX - p.x - s.cx * p.scale) * remaining
        let offsetY = (s.initialY - p.y - s.cy * p.scale) * remaining
        let fold = Double.pi / 2 * (1 - ease(frame / s.openFrames))
        let pixelScale = CGFloat(p.scale * scale) * (window?.screen.scale ?? UIScreen.main.scale)
        CATransaction.begin(); CATransaction.setDisableActions(true)
        for root in [petalRoot, wordRoot] {
            root.setAffineTransform(CGAffineTransform(scaleX: p.scale * scale, y: p.scale * scale))
        }
        petalRoot.position = CGPoint(x: (p.x - d.viewport.cropX + offsetX) * scale, y: (p.y - d.viewport.cropY + offsetY) * scale)
        wordRoot.position = CGPoint(x: (p.x - d.viewport.cropX) * scale, y: (p.y - d.viewport.cropY) * scale)
        for (i, leaf) in petals.enumerated() {
            let angle = s.leaves[i].angle * .pi / 180
            let ca = cos(angle), sa = sin(angle), c = cos(fold), sn = sin(fold)
            var t = CATransform3DIdentity
            t.m11 = ca * ca + sa * sa * c; t.m12 = ca * sa * (1 - c); t.m13 = -sa * sn; t.m14 = sa * sn / s.perspective
            t.m21 = ca * sa * (1 - c); t.m22 = sa * sa + ca * ca * c; t.m23 = ca * sn; t.m24 = -ca * sn / s.perspective
            t.m31 = sa * sn; t.m32 = -ca * sn; t.m33 = c; t.m34 = -c / s.perspective
            leaf.transform = t; leaf.contentsScale = pixelScale
        }
        for (i, glyph) in glyphs.enumerated() {
            let source = d.glyphs[i]
            let progress = min(1, max(0, (frame - source.start) / source.duration))
            let step = min(d.maskSteps, Int(floor(progress * Double(d.maskSteps))))
            glyph.isHidden = progress <= 0
            glyph.contentsScale = pixelScale; masks[i].contentsScale = pixelScale
            if steps[i] != step {
                if step == d.maskSteps { glyph.mask = nil }
                else { masks[i].path = model.masks[i][step]; glyph.mask = masks[i] }
                steps[i] = step
            }
        }
        CATransaction.commit()
    }
}

#if canImport(PreviewsMacros)
    #Preview { SplashView(autoplays: false, onComplete: {}) }
#endif
