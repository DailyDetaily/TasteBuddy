import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var appModel: AppModel
    var onOpenConnection: ((ProfileConnectionKind) -> Void)? = nil
    var onFindBuddy: (() -> Void)? = nil
    var onOpenProfileSettings: (() -> Void)? = nil
    var onOpenSavedList: (() -> Void)? = nil

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TBSpacing.section) {
                    if let profile = appModel.profile {
                        ProfileIdentityCard(
                            profile: profile,
                            followerCount: 3,
                            followingCount: 2,
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
                                ForEach(activityMetrics(for: profile)) { metric in
                                    if metric.id == "taste-list", let onOpenSavedList {
                                        Button(action: onOpenSavedList) {
                                            SummaryMetricCard(metric: metric)
                                        }
                                        .buttonStyle(.plain)
                                    } else {
                                        SummaryMetricCard(metric: metric)
                                    }
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
    }

    private func activityMetrics(for profile: TasteProfile) -> [ProfileActivityMetric] {
        let ratings = appModel.diningEntries.map(\.rating)
        let averageRating = ratings.isEmpty
            ? "-"
            : String(format: "%.1f", Double(ratings.reduce(0, +)) / Double(ratings.count))

        return [
            ProfileActivityMetric(
                id: "measurements",
                label: "미각 기록",
                value: "1회",
                symbol: "trophy",
                color: profile.strongestAxis.mainColor
            ),
            ProfileActivityMetric(
                id: "feedback",
                label: "다이닝 리뷰",
                value: "\(appModel.diningEntries.count)건",
                symbol: "checkmark.circle",
                color: TasteAxis.umami.mainColor
            ),
            ProfileActivityMetric(
                id: "taste-list",
                label: "테이스트 리스트",
                value: "\(appModel.savedRestaurantIDs.count)개",
                symbol: "bookmark",
                color: TasteAxis.salty.mainColor
            ),
            ProfileActivityMetric(
                id: "rating",
                label: "평균 만족도",
                value: averageRating,
                symbol: "star",
                color: TasteAxis.sour.mainColor
            )
        ]
    }
}

private struct ProfileIdentityCard: View {
    let profile: TasteProfile
    let followerCount: Int
    let followingCount: Int
    var onOpenConnection: ((ProfileConnectionKind) -> Void)? = nil
    var onFindBuddy: (() -> Void)? = nil
    var onOpenProfileSettings: (() -> Void)? = nil

    var body: some View {
        ProfileHeroCard(
            title: "신준호",
            handle: "@테이스트버디",
            followerCount: followerCount,
            followingCount: followingCount,
            onOpenFollowers: { onOpenConnection?(.followers) },
            onOpenFollowing: { onOpenConnection?(.following) }
        ) {
            PalateBloomAvatar(
                size: 64,
                tasteProfile: profile,
                shapeSeed: "current-user"
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
            .buttonStyle(.plain)
            .accessibilityLabel("프로필 설정 열기")
        } footerAction: {
            Button {
                onFindBuddy?()
            } label: {
                ProfileFindBuddyButtonContent()
            }
            .buttonStyle(.plain)
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
