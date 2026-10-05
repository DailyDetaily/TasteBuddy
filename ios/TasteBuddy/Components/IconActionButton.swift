import SwiftUI

enum IconActionKind: String, CaseIterable {
    case save, bookmark, like, comment, share

    var supportsActiveState: Bool {
        self == .save || self == .bookmark || self == .like
    }

    var usesSocialLayout: Bool {
        self == .like || self == .comment || self == .share
    }

    func symbol(isActive: Bool) -> LucideIconName {
        switch self {
        case .save: return isActive ? .circleCheck : .circlePlus
        case .bookmark: return .bookmark
        case .like: return .heart
        case .comment: return .messageCircle
        case .share: return .send
        }
    }
}

/// Renders action state; the caller owns navigation, mutations and persistence.
struct IconActionButton: View {
    let kind: IconActionKind
    var isActive = false
    var count: Int? = nil
    var isEnabled = true
    var color: Color? = nil
    var activeColor: Color? = nil
    var buttonSize: CGFloat = TBIcon.Container.large
    var iconSize: CGFloat? = nil
    let accessibilityLabel: String
    var action: (() -> Void)? = nil

    private var active: Bool { kind.supportsActiveState && isActive }
    private var resolvedIconSize: CGFloat {
        iconSize ?? (kind.usesSocialLayout
            ? (kind == .share ? DishFeedbackCardMetrics.shareActionIconSize : DishFeedbackCardMetrics.actionIconSize)
            : TBIcon.Size.large)
    }
    private var resolvedColor: Color {
        let idle = color ?? (kind.usesSocialLayout ? TBColor.textHint : TBColor.textSecondary)
        return active ? (activeColor ?? TBColor.textPrimary) : idle
    }

    var body: some View {
        Group {
            if let action {
                Button(action: action) { label }
                    .buttonStyle(TBTokenButtonStyle())
                    .disabled(!isEnabled)
            } else {
                label
                    .accessibilityElement(children: .ignore)
            }
        }
        .accessibilityLabel(accessibilityLabel)
        .opacity(isEnabled ? 1 : 0.45)
        .tasteBloomMotion(.feedback, value: active)
    }

    private var label: some View {
        HStack(spacing: DishFeedbackCardMetrics.actionCountGap) {
            LucideIcon(
                kind.symbol(isActive: active),
                size: resolvedIconSize,
                strokeWidth: TBIcon.Stroke.regular,
                filled: active
            )
            .tasteBloomReplace(value: active)
            .frame(
                width: kind.usesSocialLayout && count != nil
                    ? DishFeedbackCardMetrics.actionIconFrameWidth : buttonSize,
                height: buttonSize
            )
            .foregroundStyle(resolvedColor)

            if let count {
                Text("\(count)")
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textMuted)
                    .lineLimit(1)
                    .monospacedDigit()
                    .contentTransition(.opacity)
            }
        }
        .contentShape(Rectangle())
    }
}

struct RecordActions: View {
    var isRecorded = false
    var isBookmarked = false
    var isEnabled = true
    var activeColor = TBColor.textPrimary
    var recordLabel: String? = nil
    var bookmarkLabel: String? = nil
    var onRecord: (() -> Void)? = nil
    var onBookmark: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: CompactCardMetrics.actionGap) {
            if let onRecord {
                IconActionButton(
                    kind: .save, isActive: isRecorded, isEnabled: isEnabled,
                    activeColor: activeColor,
                    accessibilityLabel: recordLabel ?? (isRecorded ? "내 기록에 추가됨" : "내 기록에 추가"),
                    action: onRecord
                )
            }
            if let onBookmark {
                IconActionButton(
                    kind: .bookmark, isActive: isBookmarked, isEnabled: isEnabled,
                    activeColor: activeColor,
                    accessibilityLabel: bookmarkLabel ?? (isBookmarked ? "북마크 편집" : "북마크"),
                    action: onBookmark
                )
            }
        }
    }
}

struct SocialActions: View {
    var isLiked = false
    var likeCount: Int? = nil
    var commentCount: Int? = nil
    var shareCount: Int? = nil
    var isEnabled = true
    var accentColor = TBColor.textPrimary
    let onLike: () -> Void
    var onComment: (() -> Void)? = nil
    let onShare: () -> Void

    private func label(_ title: String, count: Int?) -> String {
        count.map { "\(title) \($0)개" } ?? title
    }

    var body: some View {
        HStack(spacing: DishFeedbackCardMetrics.actionGap) {
            IconActionButton(
                kind: .like, isActive: isLiked, count: likeCount, isEnabled: isEnabled,
                activeColor: accentColor,
                accessibilityLabel: label("좋아요", count: likeCount) + (isLiked ? ", 좋아요 취소" : ""),
                action: onLike
            )
            IconActionButton(
                kind: .comment, count: commentCount, isEnabled: isEnabled,
                accessibilityLabel: label("댓글", count: commentCount) + (onComment == nil ? "" : " 보기"),
                action: onComment
            )
            IconActionButton(
                kind: .share, count: shareCount, isEnabled: isEnabled,
                accessibilityLabel: label("공유", count: shareCount), action: onShare
            )
        }
    }
}
