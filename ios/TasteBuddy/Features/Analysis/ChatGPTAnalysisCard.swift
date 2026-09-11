import SwiftUI

struct ChatGPTAnalysisCard: View {
    @EnvironmentObject private var appModel: AppModel
    @Environment(\.openURL) private var openURL
    @State private var showsConnection = false
    @State private var showsAuth = false
    @State private var account: ChatGPTAnalysisAccount?
    @State private var isWorking = false
    @State private var message: String?
    let configuration: ChatGPTAnalysisConfiguration
    private let repository = ChatGPTAnalysisRepository()

    var body: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: TBSpacing.x12) {
                Text("내 ChatGPT로 더 깊이 알아보기")
                    .font(TBFont.semibold(14)).foregroundStyle(TBColor.textPrimary)
                Text("식사 기록을 바탕으로 내 ChatGPT에서 입맛의 의미를 살펴봐요.")
                    .font(TBFont.regular(12)).foregroundStyle(TBColor.textHint)
                PrimaryButton(title: "AI를 통해 분석") { showsConnection = true }
            }
        }
        .sheet(isPresented: $showsConnection) {
            NavigationStack {
                ScrollView {
                    VStack(alignment: .leading, spacing: TBSpacing.x16) {
                        Text("ChatGPT에서 입맛 해석하기")
                            .font(TBFont.semibold(20)).foregroundStyle(TBColor.textPrimary)
                        Text("최근 최대 20개 식사 기록의 음식 이름, 감각 평가, 작성한 원문을 분석용으로 저장해요. 연결한 ChatGPT가 24시간 동안 조회할 수 있어요.")
                        Text("처음에는 ChatGPT에서 Taste Buddy를 연결하고 아래와 같은 이메일로 로그인해 주세요. 연결 후 ‘내 입맛 기록을 해석해 줘’라고 요청하면 결과를 볼 수 있어요.")
                        if let account {
                            Text(account.email).font(TBFont.semibold(14)).foregroundStyle(TBColor.textPrimary)
                            PrimaryButton(title: isWorking ? "자료 준비 중" : "자료 저장하고 ChatGPT 열기", isEnabled: !isWorking && !appModel.sensoryAnalysisIsUpdating && appModel.sensoryAnalysisError == nil) {
                                publishAndOpen(account)
                            }
                            Button("공유한 분석 자료 삭제") { removeExport(account) }
                                .disabled(isWorking)
                        } else {
                            PrimaryButton(title: "Taste Buddy 계정 연결", isEnabled: !isWorking) { showsAuth = true }
                        }
                        Text("해석 결과는 ChatGPT에 표시됩니다. 기록을 수정했다면 다시 분석을 요청해 주세요. 자료를 삭제해도 이미 받은 ChatGPT 답변은 남을 수 있어요.")
                            .font(TBFont.regular(12))
                        if let message {
                            Text(message).foregroundStyle(TBColor.textSecondary).accessibilityLabel(message)
                        }
                    }
                    .font(TBFont.regular(14)).foregroundStyle(TBColor.textHint)
                    .padding(TBSpacing.page)
                }
                .tbPageBackground()
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("닫기") { showsConnection = false } } }
            }
            .task { await loadAccount() }
            .sheet(isPresented: $showsAuth, onDismiss: { Task { await loadAccount() } }) {
                AuthEntrySheet(intent: .linkCurrentProfile, showsDevBypass: false,
                    onContinueAsGuest: { showsAuth = false },
                    onVerifiedEmailLogin: { result in
                        if result.ok { appModel.completeVerifiedEmailAuthEntry(user: result.user, importingGuest: true); showsAuth = false }
                    },
                    onLinkedCurrentProfile: {
                        Task { _ = await appModel.completeLinkedCurrentProfileAuthEntry(); showsAuth = false }
                    })
            }
        }
    }

    @MainActor private func loadAccount() async {
        isWorking = true
        defer { isWorking = false }
        account = try? await repository.account()
    }

    private func publishAndOpen(_ account: ChatGPTAnalysisAccount) {
        let payload = ChatGPTAnalysisExport(snapshot: appModel.sensoryAnalysis)
        isWorking = true
        message = nil
        Task { @MainActor in
            defer { isWorking = false }
            do {
                try await repository.publish(payload, account: account)
                openURL(configuration.entryURL) { accepted in
                    if !accepted { message = "ChatGPT를 열지 못했습니다. 잠시 후 다시 시도해 주세요." }
                }
            } catch {
                message = (error as? ChatGPTAnalysisConnectionError)?.errorDescription
                    ?? "분석 자료를 저장하지 못했습니다. 네트워크와 로그인 상태를 확인해 주세요."
            }
        }
    }

    private func removeExport(_ account: ChatGPTAnalysisAccount) {
        isWorking = true
        Task { @MainActor in
            defer { isWorking = false }
            do {
                try await repository.removeExport(account: account)
                message = "공유한 분석 자료를 삭제했습니다. ChatGPT의 계정 연결은 ChatGPT 설정에서 해제할 수 있어요."
            } catch { message = "자료를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요." }
        }
    }
}

#Preview {
    ChatGPTAnalysisCard(configuration: .init(entryURL: URL(string: "https://chatgpt.com/plugins/tastebuddy-preview")!))
        .environmentObject(AppModel()).padding()
}
