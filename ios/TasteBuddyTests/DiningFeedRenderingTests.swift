import SwiftUI
import UIKit
import XCTest
@testable import TasteBuddy

final class DiningFeedRenderingTests: XCTestCase {
    @MainActor
    func testHundredPhotoRecordsOnlyCreateNearbyRailsAndReloadAfterScrollingBack() async throws {
        try await withFeed(recordCount: 100) { model, host in
            let initialPhotoLoaded = await self.waitForPhoto(in: host, green: false)
            XCTAssertTrue(initialPhotoLoaded)
            let rails = self.scrollViews(in: host.view).filter { abs($0.bounds.height - 144) < 2 }
            XCTAssertFalse(rails.isEmpty, "The visible record must include its photo rail")
            XCTAssertLessThan(rails.count, 12, "Opening the feed must not create all 100 photo rails")
            print("DINING_FEED_VISIBLE_RAILS records=100 initialRails=\(rails.count)")

            let scroll = try XCTUnwrap(self.scrollViews(in: host.view).first {
                $0.contentSize.height > $0.bounds.height + 1 && $0.bounds.height > 400
            })
            scroll.setContentOffset(CGPoint(x: 0, y: 2_000), animated: false)
            try await Task.sleep(for: .milliseconds(200))
            host.view.layoutIfNeeded()
            scroll.setContentOffset(.zero, animated: false)
            let returnedPhotoLoaded = await self.waitForPhoto(in: host, green: false)
            XCTAssertTrue(returnedPhotoLoaded, "Photos must reload after off-screen state is released")
            XCTAssertEqual(model.diningEntries.count, 100)
            self.attach(host, name: "Dining feed with 100 photo records")
        }
    }

    @MainActor
    func testReplacingAndRemovingVisiblePhotoRefreshesTheCardAndCleansOldFile() async throws {
        try await withFeed(recordCount: 1) { model, host in
            let initialPhotoLoaded = await self.waitForPhoto(in: host, green: false)
            XCTAssertTrue(initialPhotoLoaded)
            let previous = try XCTUnwrap(model.diningEntries.first)
            let oldFilename = try XCTUnwrap(previous.reflectionPhotoFilename)
            let replacement = try DiningReflectionPhotoStore.save(
                self.photoData(green: true), entryID: previous.id
            )
            defer { DiningReflectionPhotoStore.remove(filename: replacement) }
            XCTAssertNotEqual(oldFilename, replacement)
            model.updateDiningEntry(self.entry(id: previous.id, filename: replacement))
            let replacementLoaded = await self.waitForPhoto(in: host, green: true)
            XCTAssertTrue(replacementLoaded, "The existing card must display the replacement photo")
            XCTAssertNil(DiningReflectionPhotoStore.data(for: oldFilename))
            self.attach(host, name: "Dining photo after replacement")

            model.updateDiningEntry(self.entry(id: previous.id, filename: nil))
            try await Task.sleep(for: .milliseconds(150))
            host.view.layoutIfNeeded()
            XCTAssertNil(DiningReflectionPhotoStore.data(for: replacement))
            XCTAssertEqual(self.photoPixelCount(in: host, green: true), 0)
            XCTAssertTrue(self.scrollViews(in: host.view).allSatisfy { abs($0.bounds.height - 144) >= 2 })
        }
    }

    @MainActor
    private func withFeed(
        recordCount: Int,
        verify: (AppModel, UIHostingController<AnyView>) async throws -> Void
    ) async throws {
        let suite = "tastebuddy.dining-render.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        var filenames: [String] = []
        defer {
            filenames.forEach { DiningReflectionPhotoStore.remove(filename: $0) }
            defaults.removePersistentDomain(forName: suite)
        }
        let data = photoData(green: false)
        let entries = try (0..<recordCount).map { index in
            let id = UUID()
            let filename = try DiningReflectionPhotoStore.save(data, entryID: id)
            filenames.append(filename)
            return entry(id: id, filename: filename, dateOffset: index)
        }
        defaults.set(try JSONEncoder().encode(entries), forKey: "tastebuddy.ios.dining-entries.v1")
        let model = AppModel(defaults: defaults, authRepository: FixtureBackendAuthRepository())
        let host = UIHostingController(rootView: AnyView(
            DiningView().environmentObject(model).preferredColorScheme(.light)
        ))
        let viewport = CGRect(x: 0, y: 0, width: 393, height: 852)
        let window = UIWindow(frame: viewport)
        window.rootViewController = host
        window.makeKeyAndVisible()
        host.view.frame = viewport
        host.view.layoutIfNeeded()
        defer {
            window.isHidden = true
            window.rootViewController = nil
        }
        try await verify(model, host)
    }

    private func entry(id: UUID, filename: String?, dateOffset: Int = 0) -> DiningEntry {
        DiningEntry(
            id: id, restaurant: "사진 검증", menu: "구운 채소",
            date: Date(timeIntervalSince1970: 1_700_000_000 - Double(dateOffset)),
            rating: 5, note: "기록 사진 검증", tasteExperienceIDs: ["umami-clear"],
            detailTagIDs: ["flow-clean-finish"], dishKindIDs: ["grilled_smoked"],
            reflectionPhotoFilename: filename,
            tbaAnalysisSnapshot: .init(
                confidence: 0.8, detailTags: [], foodKnowledgeMatchIds: [], foodOnMatchIds: [],
                generatedAt: "2026-09-03T00:00:00Z", lexiconCandidateIds: [], source: "test",
                subject: "구운 채소", summary: "기록 사진 검증", tasteBubbles: [],
                tbaSignalIds: [], version: "1"
            )
        )
    }

    @MainActor
    private func photoData(green: Bool) -> Data {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 600, height: 400), format: format)
        return renderer.jpegData(withCompressionQuality: 0.9) { context in
            (green ? UIColor.green : UIColor.magenta).setFill()
            context.fill(CGRect(x: 0, y: 0, width: 600, height: 400))
        }
    }

    @MainActor
    private func waitForPhoto(in host: UIViewController, green: Bool) async -> Bool {
        let deadline = Date().addingTimeInterval(4)
        while Date() < deadline {
            host.view.layoutIfNeeded()
            if photoPixelCount(in: host, green: green) > 1_000 { return true }
            try? await Task.sleep(for: .milliseconds(60))
        }
        return false
    }

    @MainActor
    private func snapshot(_ host: UIViewController) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        return UIGraphicsImageRenderer(size: host.view.bounds.size, format: format).image { _ in
            host.view.drawHierarchy(in: host.view.bounds, afterScreenUpdates: true)
        }
    }

    @MainActor
    private func photoPixelCount(in host: UIViewController, green: Bool) -> Int {
        guard let image = snapshot(host).cgImage else { return 0 }
        let width = image.width, height = image.height
        var pixels = [UInt8](repeating: 0, count: width * height * 4)
        return pixels.withUnsafeMutableBytes { bytes in
            guard let context = CGContext(
                data: bytes.baseAddress, width: width, height: height,
                bitsPerComponent: 8, bytesPerRow: width * 4,
                space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
            ) else { return 0 }
            context.draw(image, in: CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height)))
            let values = bytes.bindMemory(to: UInt8.self)
            return stride(from: 0, to: values.count, by: 4).reduce(0) { total, index in
                let red = values[index], g = values[index + 1], blue = values[index + 2]
                let matches = green ? g > 220 && red < 40 && blue < 40 : red > 220 && blue > 220 && g < 40
                return total + (matches ? 1 : 0)
            }
        }
    }

    @MainActor
    private func scrollViews(in view: UIView) -> [UIScrollView] {
        let current = (view as? UIScrollView).map { [$0] } ?? []
        return current + view.subviews.flatMap(scrollViews(in:))
    }

    @MainActor
    private func attach(_ host: UIViewController, name: String) {
        let attachment = XCTAttachment(image: snapshot(host))
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
