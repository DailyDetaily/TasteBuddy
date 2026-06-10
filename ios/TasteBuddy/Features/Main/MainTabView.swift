import SwiftUI

struct MainTabView: View {
    var body: some View {
        AppShellView()
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
