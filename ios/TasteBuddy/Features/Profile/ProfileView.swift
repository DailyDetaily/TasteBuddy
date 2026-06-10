import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var appModel: AppModel
    var onOpenConnection: ((ProfileConnectionKind) -> Void)? = nil
    var onFindBuddy: (() -> Void)? = nil
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
                            onFindBuddy: onFindBuddy
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
                .padding(TBSpacing.page)
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

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .top) {
                    HStack(spacing: 14) {
                        PalateBloomAvatar(
                            size: 64,
                            tasteProfile: profile,
                            shapeSeed: "current-user"
                        )

                        VStack(alignment: .leading, spacing: 4) {
                            Text("신준호")
                                .font(TBFont.bold(16))
                                .foregroundStyle(TBColor.textPrimary)
                            Text("@머리아깨무봄발")
                                .font(TBFont.semibold(12))
                                .foregroundStyle(TBColor.textHint)
                        }
                    }

                    Spacer()

                    LucideIcon(
                        .settings,
                        size: TBIcon.Size.control,
                        strokeWidth: TBIcon.Stroke.regular
                    )
                        .frame(width: 36, height: 36)
                        .foregroundStyle(TBColor.textSecondary)
                }

                HStack(spacing: 18) {
                    SocialCount(value: followerCount, label: "팔로워") {
                        onOpenConnection?(.followers)
                    }
                    SocialCount(value: followingCount, label: "팔로잉") {
                        onOpenConnection?(.following)
                    }
                    Spacer()
                    Button {
                        onFindBuddy?()
                    } label: {
                        NeutralChip(title: "버디 찾기", symbol: "person.badge.plus")
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct SocialCount: View {
    let value: Int
    let label: String
    var action: (() -> Void)? = nil

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
        .frame(minWidth: 58, alignment: .leading)
    }
}
