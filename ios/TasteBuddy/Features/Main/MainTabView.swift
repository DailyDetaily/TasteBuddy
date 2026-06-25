import SwiftUI

struct MainTabView: View {
    var onStagedSheetPresentationChange: ((Bool) -> Void)? = nil

    var body: some View {
        AppShellView(onStagedSheetPresentationChange: onStagedSheetPresentationChange)
    }
}

#if canImport(PreviewsMacros)
    #Preview {
        MainTabView()
            .environmentObject(AppModel.preview(
                onboardingComplete: true,
                profile: .sample,
                diningEntries: [.sample]
            ))
    }
#endif
