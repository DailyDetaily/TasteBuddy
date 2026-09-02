import SwiftUI

struct ProfileHeroCard<Avatar: View, HeaderAction: View, FooterAction: View>: View {
    let title: String
    let handle: String
    let followerCount: Int
    let followingCount: Int
    var onOpenFollowers: (() -> Void)?
    var onOpenFollowing: (() -> Void)?

    private let avatar: Avatar
    private let headerAction: HeaderAction
    private let footerAction: FooterAction

    init(
        title: String,
        handle: String,
        followerCount: Int,
        followingCount: Int,
        onOpenFollowers: (() -> Void)? = nil,
        onOpenFollowing: (() -> Void)? = nil,
        @ViewBuilder avatar: () -> Avatar,
        @ViewBuilder headerAction: () -> HeaderAction,
        @ViewBuilder footerAction: () -> FooterAction
    ) {
        self.title = title
        self.handle = handle
        self.followerCount = followerCount
        self.followingCount = followingCount
        self.onOpenFollowers = onOpenFollowers
        self.onOpenFollowing = onOpenFollowing
        self.avatar = avatar()
        self.headerAction = headerAction()
        self.footerAction = footerAction()
    }

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .top) {
                    HStack(spacing: 14) {
                        avatar

                        VStack(alignment: .leading, spacing: 4) {
                            Text(title)
                                .font(TBFont.bold(16))
                                .foregroundStyle(TBColor.textPrimary)
                                .lineLimit(1)

                            Text(handle)
                                .font(TBFont.semibold(12))
                                .foregroundStyle(TBColor.textHint)
                                .lineLimit(1)
                        }
                    }

                    Spacer()

                    headerAction
                }

                HStack(spacing: 18) {
                    ProfileHeroSocialCount(
                        value: followerCount,
                        label: "팔로워",
                        action: onOpenFollowers
                    )
                    ProfileHeroSocialCount(
                        value: followingCount,
                        label: "팔로잉",
                        action: onOpenFollowing
                    )

                    Spacer()

                    footerAction
                }
            }
        }
    }
}

private struct ProfileHeroSocialCount: View {
    let value: Int
    let label: String
    var action: (() -> Void)?

    var body: some View {
        Group {
            if let action {
                Button(action: action) {
                    content
                }
                .buttonStyle(.plain)
            } else {
                content
            }
        }
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text("\(value)")
                .font(TBFont.semibold(14))
                .foregroundStyle(TBColor.textPrimary)

            Text(label)
                .font(TBFont.regular(12))
                .foregroundStyle(TBColor.textHint)
        }
        .frame(minWidth: 64, alignment: .leading)
    }
}

#Preview("Own profile hero") {
    ProfileHeroCard(
        title: "신준호",
        handle: "@테이스트버디",
        followerCount: 3,
        followingCount: 2
    ) {
        PalateBloomAvatar(
            size: 64,
            tasteProfile: .sample,
            shapeSeed: "current-user"
        )
    } headerAction: {
        LucideIcon(
            .settings,
            size: TBIcon.Size.large,
            strokeWidth: TBIcon.Stroke.regular
        )
        .frame(width: TBIcon.Container.large, height: TBIcon.Container.large)
        .foregroundStyle(TBColor.iconPrimary)
    } footerAction: {
        Text("버디 찾기")
            .font(TBFont.semibold(12))
            .foregroundStyle(TBColor.textPrimary)
            .padding(.horizontal, 12)
            .frame(height: 36)
            .background(TBColor.surface)
            .clipShape(Capsule())
            .overlay {
                Capsule().stroke(TBColor.border, lineWidth: 1)
            }
    }
    .padding(20)
    .background(TBColor.page)
}

#Preview("Public profile hero") {
    ProfileHeroCard(
        title: "김민아",
        handle: "@맑은끝민아",
        followerCount: 18,
        followingCount: 12
    ) {
        PalateBloomAvatar(size: 64, seed: "mina")
    } headerAction: {
        EmptyView()
    } footerAction: {
        Text("팔로잉")
            .font(TBFont.semibold(12))
            .foregroundStyle(TBColor.textPrimary)
            .padding(.horizontal, 14)
            .frame(height: 36)
            .background(TBColor.surface)
            .clipShape(Capsule())
            .overlay {
                Capsule().stroke(TBColor.border, lineWidth: 1)
            }
    }
    .padding(20)
    .background(TBColor.page)
}
