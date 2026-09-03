import XCTest
@testable import TasteBuddy

final class NativeToastPresenterTests: XCTestCase {
    @MainActor
    func testReplacementIgnoresObsoleteTimeoutAndDismissesCurrentOnlyOnce() async {
        let firstStarted = expectation(description: "First toast timer started")
        let secondStarted = expectation(description: "Replacement timer started")
        let sleeper = ControlledToastSleeper { index in
            (index == 0 ? firstStarted : secondStarted).fulfill()
        }
        let presenter = TBToastPresenter(sleep: sleeper.sleep)
        var firstDismissals = 0
        var currentDismissals = 0

        presenter.present(policy: .copyConfirmation) { firstDismissals += 1 }
        await fulfillment(of: [firstStarted], timeout: 1)
        presenter.present(policy: .undo) { currentDismissals += 1 }
        await fulfillment(of: [secondStarted], timeout: 1)

        // This sleeper intentionally ignores Task cancellation, exercising the guard.
        sleeper.finish(at: 0)
        await Task.yield()
        XCTAssertTrue(presenter.isPresented)
        XCTAssertEqual(firstDismissals, 0)

        presenter.dismiss()
        presenter.dismiss()
        sleeper.finish(at: 1)
        await Task.yield()
        XCTAssertFalse(presenter.isPresented)
        XCTAssertEqual(firstDismissals, 0)
        XCTAssertEqual(currentDismissals, 1)
        XCTAssertEqual(sleeper.durations, [3_500_000_000, 3_500_000_000])
    }

    @MainActor
    func testHostCancellationDoesNotCloseBookmarkSheetAfterTimeout() async {
        let started = expectation(description: "Bookmark timer started")
        let sleeper = ControlledToastSleeper { _ in started.fulfill() }
        let presenter = TBToastPresenter(sleep: sleeper.sleep)
        var sheetDismissals = 0

        presenter.present(policy: .bookmarkSheetClose) { sheetDismissals += 1 }
        await fulfillment(of: [started], timeout: 1)
        presenter.cancel()
        sleeper.finish(at: 0)
        await Task.yield()

        XCTAssertFalse(presenter.isPresented)
        XCTAssertEqual(sheetDismissals, 0)
        XCTAssertEqual(sleeper.durations, [700_000_000])
    }

    @MainActor
    func testUndoTimeoutCompletesCurrentCleanupOnce() async {
        let started = expectation(description: "Undo timer started")
        let completed = expectation(description: "Undo state expires")
        let sleeper = ControlledToastSleeper { _ in started.fulfill() }
        let presenter = TBToastPresenter(sleep: sleeper.sleep)
        var undoData: String? = "deleted-menu"
        var completions = 0

        presenter.present(policy: .undo) {
            undoData = nil
            completions += 1
            completed.fulfill()
        }
        await fulfillment(of: [started], timeout: 1)
        sleeper.finish(at: 0)
        await fulfillment(of: [completed], timeout: 1)
        presenter.dismiss()

        XCTAssertNil(undoData)
        XCTAssertFalse(presenter.isPresented)
        XCTAssertEqual(completions, 1)
    }
}

@MainActor
private final class ControlledToastSleeper {
    private var continuations: [CheckedContinuation<Void, Never>?] = []
    private let onStart: (Int) -> Void
    private(set) var durations: [UInt64] = []

    init(onStart: @escaping (Int) -> Void) {
        self.onStart = onStart
    }

    func sleep(_ duration: UInt64) async {
        await withCheckedContinuation { continuation in
            let index = continuations.count
            continuations.append(continuation)
            durations.append(duration)
            onStart(index)
        }
    }

    func finish(at index: Int) {
        guard continuations.indices.contains(index) else { return }
        continuations[index]?.resume()
        continuations[index] = nil
    }
}
