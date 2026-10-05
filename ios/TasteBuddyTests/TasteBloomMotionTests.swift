import SwiftUI
import UIKit
import XCTest
@testable import TasteBuddy

final class TasteBloomMotionTests: XCTestCase {
    func testControlPressKeepsTravelBoundedAcrossSmallAndWideSurfaces() {
        let sizes = [
            CGSize(width: 22, height: 22), CGSize(width: 44, height: 44),
            CGSize(width: 120, height: 48), CGSize(width: 343, height: 48),
            CGSize(width: 720, height: 48), CGSize(width: 2048, height: 48),
            CGSize(width: 320, height: 120),
        ]
        for size in sizes {
            let response = TBControlFeedback.response(
                size: size, isPressed: true, isEnabled: true, reduceMotion: false
            )
            XCTAssertTrue(response.showsPressedSurface)
            XCTAssertLessThan(response.scale, 1)
            XCTAssertGreaterThanOrEqual(response.scale, 23.0 / 24)
            XCTAssertLessThanOrEqual(size.width * (1 - response.scale), 4.000001)
            XCTAssertLessThanOrEqual(size.height * (1 - response.scale), 1.000001)
        }
        let regular = TBControlFeedback.response(
            size: CGSize(width: 120, height: 48), isPressed: true, isEnabled: true, reduceMotion: false
        )
        XCTAssertEqual(48 * (1 - regular.scale), 1, accuracy: 0.000001)
    }

    func testControlPressRetainsSurfaceUnderReducedMotionAndClearsOnReleaseOrDisable() {
        let size = CGSize(width: 343, height: 48)
        let reduced = TBControlFeedback.response(
            size: size, isPressed: true, isEnabled: true, reduceMotion: true
        )
        XCTAssertTrue(reduced.showsPressedSurface, "동작 줄이기에서도 입력 도달은 표면색으로 알려야 한다")
        XCTAssertEqual(reduced.scale, 1)
        for reduceMotion in [false, true] {
            for state in [(pressed: false, enabled: true), (pressed: true, enabled: false)] {
                let response = TBControlFeedback.response(
                    size: size, isPressed: state.pressed, isEnabled: state.enabled, reduceMotion: reduceMotion
                )
                XCTAssertFalse(response.showsPressedSurface, "놓기·취소·실제 비활성은 누름 표시를 없앤다")
                XCTAssertEqual(response.scale, 1)
            }
        }
    }

    func testUnmeasuredOrInvalidControlSizeNeverProducesAnInvalidTransform() {
        for size in [CGSize.zero, CGSize(width: -1, height: 48),
                     CGSize(width: CGFloat.infinity, height: 48), CGSize(width: 48, height: CGFloat.nan)] {
            let response = TBControlFeedback.response(
                size: size, isPressed: true, isEnabled: true, reduceMotion: false
            )
            XCTAssertEqual(response.scale, 1)
            XCTAssertTrue(response.showsPressedSurface, "크기를 알기 전에도 표면색은 입력에 반응한다")
        }
    }

    func testPetalCurveOpensSoftlyAndSettlesAfterOneSmallLateBud() {
        let samples = (0...1000).map { TasteBloomMotion.progress(Double($0) / 1000) }
        XCTAssertEqual(TasteBloomMotion.progress(-1), 0)
        XCTAssertEqual(TasteBloomMotion.progress(2), 1)
        XCTAssertEqual(samples.first, 0)
        XCTAssertEqual(samples.last, 1)
        XCTAssertLessThan(samples[10], 0.01, "꽃잎의 시작은 급하게 튀지 않는다")
        let peak = samples.max()!
        let peakIndex = samples.firstIndex(of: peak)!
        XCTAssertGreaterThan(peak, 1.005)
        XCTAssertLessThan(peak, 1.02, "끝의 봉우리는 2% 이내로 제한한다")
        XCTAssertGreaterThan(peakIndex, 450, "텐션 이후에는 잔잔하게 안착한다")
        for index in 1...peakIndex { XCTAssertGreaterThanOrEqual(samples[index], samples[index - 1]) }
        let tail = Array(samples[peakIndex...])
        let rebound = zip(tail, tail.dropFirst()).reduce(0.0) { $0 + max($1.1 - $1.0, 0) }
        XCTAssertLessThan(rebound, 0.001, "잔여 스프링 진동은 보이지 않는 크기로 감쇠한다")
        XCTAssertEqual(samples[samples.count - 2], 1, accuracy: 0.001)
        for sample in samples { XCTAssertGreaterThanOrEqual(sample, 0) }
        // 데이터 차트에는 UI 표면의 오버슈트를 전달하지 않는다.
        for index in 0...100 {
            XCTAssertTrue((0...1).contains(TasteRadarContract.animationProgress(CGFloat(index) / 100)))
        }
    }

    func testChartsWaitUntilEnoughOfTheirActualScrollViewportIsVisible() {
        let size = CGSize(width: 200, height: 200)
        XCTAssertTrue(TasteBloomMotion.chartIsVisible(size: size, viewport: nil))
        XCTAssertFalse(TasteBloomMotion.chartIsVisible(size: .zero, viewport: nil))
        XCTAssertFalse(TasteBloomMotion.chartIsVisible(size: size, viewport: CGRect(x: 0, y: -300, width: 200, height: 200)))
        XCTAssertFalse(TasteBloomMotion.chartIsVisible(size: size, viewport: CGRect(x: 200, y: 0, width: 200, height: 200)))
        XCTAssertFalse(TasteBloomMotion.chartIsVisible(size: size, viewport: CGRect(x: 0, y: 180, width: 200, height: 200)))
        XCTAssertTrue(TasteBloomMotion.chartIsVisible(size: size, viewport: CGRect(x: 0, y: 170, width: 200, height: 200)))
        XCTAssertTrue(TasteBloomMotion.chartIsVisible(size: CGSize(width: 40, height: 32), viewport: CGRect(x: 0, y: 26, width: 40, height: 40)))
    }

    func testRolesShareOneScheduleAndReducedMotionHasNoAnimationOrWait() {
        XCTAssertEqual(TasteBloomMotion.Role.allCases.map(\.duration), [0.12, 0.18, 0.30, 0.50, 0.72])
        for role in TasteBloomMotion.Role.allCases {
            XCTAssertNotNil(TasteBloomMotion.animation(role, reduceMotion: false))
            XCTAssertNil(TasteBloomMotion.animation(role, reduceMotion: true))
            XCTAssertEqual(TasteBloomMotion.duration(role, reduceMotion: true), 0)
            XCTAssertEqual(TasteBloomMotion.duration(role, reduceMotion: false), TasteBloomMotion.spring(role).settlingDuration)
        }
        XCTAssertEqual(DiningFeedbackTasteBloomTransitionMetrics.duration, TasteBloomMotion.duration(.bloom, reduceMotion: false))
        XCTAssertEqual(DiningFeedbackTasteBloomTransitionMetrics.dismissalDuration, TasteBloomMotion.duration(.sheet, reduceMotion: false))
        XCTAssertEqual(StagedBottomSheetBackgroundMetrics.animationDuration, TasteBloomMotion.duration(.sheet, reduceMotion: false))
        let fadeDuration = DiningFeedbackTasteBloomTransitionMetrics.dismissalDuration
            * (1 - DiningFeedbackTasteBloomTransitionMetrics.dismissalFadeStartProgress)
        XCTAssertEqual(fadeDuration, TasteBloomMotion.duration(.press, reduceMotion: false), accuracy: 1e-9)
    }

    func testNativeSpringAndCanvasShareTheSameMotionAtEveryRoleDuration() {
        for role in TasteBloomMotion.Role.allCases {
            let spring = TasteBloomMotion.spring(role)
            let layer = TasteBloomMotion.layerAnimation(role, keyPath: "transform")
            XCTAssertEqual(spring.duration, role.duration, accuracy: 0.001)
            XCTAssertEqual(spring.bounce, TasteBloomMotion.bounce, accuracy: 1e-6)
            XCTAssertEqual(layer.mass, spring.mass)
            XCTAssertEqual(layer.stiffness, spring.stiffness)
            XCTAssertEqual(layer.damping, spring.damping)
            XCTAssertEqual(layer.duration, spring.settlingDuration)
            for step in 1..<100 {
                let progress = Double(step) / 100
                XCTAssertEqual(spring.value(target: 1, time: progress * spring.settlingDuration),
                               TasteBloomMotion.progress(progress, role: role), accuracy: 0.001)
            }
        }
    }

    @MainActor
    func testUIKitSpringAnimatorFinishesAtTheTarget() {
        let view = UIView(frame: CGRect(x: 0, y: 0, width: 20, height: 20))
        let completed = expectation(description: "UIKit 모션 완료")
        let animator = TasteBloomMotion.animator(.feedback) {
            view.center.x = 110
        }
        // UIKit은 같은 물성에서도 미세한 잔여 움직임을 SwiftUI보다 일찍 완료 처리한다.
        XCTAssertGreaterThanOrEqual(animator.duration, TasteBloomMotion.Role.feedback.duration)
        XCTAssertEqual(TasteBloomMotion.spring(.feedback).value(target: 1, time: animator.duration),
                       1, accuracy: 0.001)
        XCTAssertEqual(animator.timingParameters?.timingCurveType, .spring)
        animator.addCompletion { position in
            XCTAssertEqual(position, .end)
            completed.fulfill()
        }
        animator.startAnimation()
        wait(for: [completed], timeout: 2)
        XCTAssertEqual(view.center.x, 110, accuracy: 1e-6)
    }
}
