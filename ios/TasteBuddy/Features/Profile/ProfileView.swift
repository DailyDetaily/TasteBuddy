import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var appModel: AppModel
    var systemTopChrome: AnyView? = nil
    var onOpenConnection: ((ProfileConnectionKind) -> Void)? = nil
    var onFindBuddy: (() -> Void)? = nil
    var onOpenProfileSettings: (() -> Void)? = nil
    var onOpenSavedList: (() -> Void)? = nil

    var body: some View {
        NavigationStack {
            MainTabChromeScrollView(topChrome: systemTopChrome) {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    ProfileIdentityCard(
                        identity: appModel.profileIdentity,
                        profile: appModel.profile,
                        avatarImageData: appModel.profileAvatarImageData,
                        followerCount: nil,
                        followingCount: nil,
                        onOpenConnection: onOpenConnection,
                        onFindBuddy: onFindBuddy,
                        onOpenProfileSettings: onOpenProfileSettings
                    )

                    TBPageSection(title: "활동 요약") {
                        LazyVGrid(
                            columns: [
                                GridItem(.flexible(), spacing: 12),
                                GridItem(.flexible(), spacing: 12)
                            ],
                            spacing: 12
                        ) {
                            ForEach(activityMetrics) { metric in
                                if metric.id == "taste-list", let onOpenSavedList {
                                    Button(action: onOpenSavedList) {
                                        SummaryMetricCard(metric: metric)
                                    }
                                    .buttonStyle(TBTokenButtonStyle())
                                } else {
                                    SummaryMetricCard(metric: metric)
                                }
                            }
                        }
                    }

                }
                .tbPageContentPadding(bottom: TBSpacing.mainTabContentBottom)
                .tbCardBordersVisible(false)
            }
            .navigationTitle("프로필")
            .tbInlineNavigationTitle()
            .toolbar(.hidden, for: .navigationBar)
            .tbPageBackground()
        }
        .ignoresSafeArea(.container, edges: systemTopChrome == nil ? [] : .top)
    }

    private var activityMetrics: [ProfileActivityMetric] {
        let completedEntries = appModel.diningEntries.filter(\.hasCompletedTasteFeedback)

        return [
            ProfileActivityMetric(
                id: "evidence",
                label: "근거 기록",
                value: "\(appModel.sensoryAnalysis.sourceExperienceCount)개",
                symbol: "trophy",
                color: TBColor.textSecondary
            ),
            ProfileActivityMetric(
                id: "feedback",
                label: "다이닝 리뷰",
                value: "\(completedEntries.count)건",
                symbol: "checkmark.circle",
                color: TBColor.textSecondary
            ),
            ProfileActivityMetric(
                id: "taste-list",
                label: "테이스트 리스트",
                value: "\(appModel.savedRestaurantIDs.count)개",
                symbol: "bookmark",
                color: TBColor.textSecondary
            ),
            ProfileActivityMetric(
                id: "insights",
                label: "현재 인사이트",
                value: "\(appModel.sensoryAnalysis.insights.count)개",
                symbol: "sparkles",
                color: TBColor.textSecondary
            )
        ]
    }
}

private struct ProfileIdentityCard: View {
    let identity: UserProfileIdentity
    var profile: TasteProfile? = nil
    var avatarImageData: Data? = nil
    let followerCount: Int?
    let followingCount: Int?
    var onOpenConnection: ((ProfileConnectionKind) -> Void)? = nil
    var onFindBuddy: (() -> Void)? = nil
    var onOpenProfileSettings: (() -> Void)? = nil

    var body: some View {
        ProfileHeroCard(
            title: identity.displayName,
            handle: identity.displayNickname,
            followerCount: followerCount,
            followingCount: followingCount,
            onOpenFollowers: { onOpenConnection?(.followers) },
            onOpenFollowing: { onOpenConnection?(.following) }
        ) {
            PalateBloomAvatar(
                size: 64,
                tasteProfile: profile,
                shapeSeed: "current-user",
                image: avatarImageData.flatMap(UIImage.init(data:))
            )
        } headerAction: {
            Button {
                onOpenProfileSettings?()
            } label: {
                LucideIcon(
                    .settings,
                    size: TBIcon.Size.large,
                    strokeWidth: TBIcon.Stroke.regular
                )
                .frame(
                    width: TBIcon.Container.large,
                    height: TBIcon.Container.large
                )
                .foregroundStyle(TBColor.iconPrimary)
                .contentShape(Circle())
            }
            .buttonStyle(TBTokenButtonStyle())
            .accessibilityLabel("프로필 설정 열기")
        } footerAction: {
            Button {
                onFindBuddy?()
            } label: {
                ProfileFindBuddyButtonContent()
            }
            .buttonStyle(TBTokenButtonStyle())
        }
    }
}

private enum ProfileFindBuddyButtonMetrics {
    static let height: CGFloat = 36
    static let horizontalPadding: CGFloat = TBSpacing.x12
    static let gap: CGFloat = TBSpacing.x8
    static let iconSize: CGFloat = TBIcon.Size.small
    static let fontSize: CGFloat = 12
}

private struct ProfileFindBuddyButtonContent: View {
    var body: some View {
        HStack(spacing: ProfileFindBuddyButtonMetrics.gap) {
            LucideIcon(
                .userPlus,
                size: ProfileFindBuddyButtonMetrics.iconSize,
                strokeWidth: TBIcon.Stroke.regular
            )
            .foregroundStyle(TBColor.iconPrimary)

            Text("버디 찾기")
                .font(TBFont.semibold(ProfileFindBuddyButtonMetrics.fontSize))
                .foregroundStyle(TBColor.textPrimary)
        }
        .lineLimit(1)
        .padding(.horizontal, ProfileFindBuddyButtonMetrics.horizontalPadding)
        .frame(height: ProfileFindBuddyButtonMetrics.height)
        .background(TBColor.surface)
        .clipShape(Capsule())
        .overlay {
            Capsule().stroke(TBColor.border, lineWidth: 1)
        }
        .fixedSize(horizontal: true, vertical: false)
    }
}
