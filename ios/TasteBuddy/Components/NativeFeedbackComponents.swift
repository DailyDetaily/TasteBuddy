import SwiftUI
import UIKit

/// Timing belongs to the action's product contract, not the toast's appearance.
enum TBToastPolicy: CaseIterable {
    case copyConfirmation
    case undo
    case bookmarkSheetClose

    var durationNanoseconds: UInt64 {
        switch self {
        case .copyConfirmation, .undo:
            ToastSurface.defaultDisplayDurationNanoseconds
        case .bookmarkSheetClose:
            700_000_000
        }
    }
}

/// Owns visibility and timeout only. The feature keeps its message and undo data.
@MainActor
final class TBToastPresenter: ObservableObject {
    @Published private(set) var isPresented = false

    private var timeoutTask: Task<Void, Never>?
    private var generation = 0
    private var dismissal: (() -> Void)?
    private let sleep: @MainActor (UInt64) async throws -> Void

    init(
        sleep: @escaping @MainActor (UInt64) async throws -> Void = {
            try await Task.sleep(nanoseconds: $0)
        }
    ) {
        self.sleep = sleep
    }

    deinit {
        timeoutTask?.cancel()
    }

    /// Replaces an existing toast without invoking its dismissal callback.
    func present(policy: TBToastPolicy, onDismiss: (() -> Void)? = nil) {
        cancel()
        isPresented = true
        dismissal = onDismiss
        let expectedGeneration = generation
        let duration = policy.durationNanoseconds
        let sleep = sleep

        timeoutTask = Task { [weak self] in
            do {
                try await sleep(duration)
            } catch {
                return
            }
            guard !Task.isCancelled, let self, self.generation == expectedGeneration else {
                return
            }
            self.dismiss()
        }
    }

    /// Completes a visible toast, including its optional feature-owned cleanup.
    func dismiss() {
        guard isPresented else { return }
        let completion = dismissal
        cancel()
        withAnimation(TasteBloomMotion.animation(.feedback, reduceMotion: UIAccessibility.isReduceMotionEnabled)) {
            completion?()
        }
    }

    /// Cancels pending work without completing an action or closing a sheet.
    /// Call when the host disappears or when the feature consumes an undo action.
    func cancel() {
        generation += 1
        timeoutTask?.cancel()
        timeoutTask = nil
        dismissal = nil
        withAnimation(TasteBloomMotion.animation(.feedback, reduceMotion: UIAccessibility.isReduceMotionEnabled)) {
            isPresented = false
        }
    }
}

#if canImport(PreviewsMacros)
    #Preview("Toast confirmation and undo") {
        VStack(spacing: 12) {
            ToastSurface(
                title: "프로필 URL을 복사했어요",
                message: "원하는 곳에 붙여넣어 공유할 수 있어요.",
                icon: .copy,
                tone: .success
            )
            ToastSurface(
                title: "메뉴를 삭제했어요",
                actionTitle: "되돌리기",
                action: {}
            )
        }
        .padding(TBSpacing.page)
        .background(TBColor.page)
    }
#endif
