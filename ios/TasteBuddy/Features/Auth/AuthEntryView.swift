import SwiftUI

enum AuthEntryStep: String, Equatable {
    case email
    case code
}

enum AuthEntryStatus: String, Equatable {
    case idle
    case submitting
    case success
    case error

    var isSubmitting: Bool {
        self == .submitting
    }
}

enum AuthEntryCompletion: Equatable {
    case continueAsGuest
    case verifiedEmailLogin(BackendAuthResult)
    case linkedCurrentProfile
}

enum AuthEntryDebugBypass {
    #if DEBUG || targetEnvironment(simulator)
        static let isEnabled = true
    #else
        static let isEnabled = false
    #endif
}

@MainActor
final class AuthEntryModel: ObservableObject {
    @Published var email = ""
    @Published var code = ""
    @Published var isCodeOptionOpen = false
    @Published var isCancelConfirmOpen = false
    @Published private(set) var intent: BackendAuthEmailIntent
    @Published private(set) var step: AuthEntryStep = .email
    @Published private(set) var status: AuthEntryStatus = .idle
    @Published private(set) var message: String?
    @Published private(set) var pendingEmail: String?

    let isConfigured: Bool
    private let repository: any BackendAuthRepository
    private let isAnonymousUser: Bool
    private let redirectURL: URL?
    private var hasPreparedAnonymousSession = false

    init(
        intent: BackendAuthEmailIntent = .startWithEmail,
        repository: any BackendAuthRepository = BackendAuthRepositoryFactory.makeDefault(),
        isConfigured: Bool = BackendAuthRepositoryFactory.isConfigured(),
        isAnonymousUser: Bool = true,
        redirectURL: URL? = nil
    ) {
        self.intent = intent
        self.repository = repository
        self.isConfigured = isConfigured
        self.isAnonymousUser = isAnonymousUser
        self.redirectURL = redirectURL
    }

    var isSubmitting: Bool {
        status.isSubmitting
    }

    var footerButtonTitle: String {
        if isSubmitting {
            return step == .code ? "확인 중" : "코드 보내는 중"
        }

        if step == .code {
            return "인증 코드 확인"
        }

        return intent == .linkCurrentProfile ? "연결 코드 받기" : "다음"
    }

    var canSubmit: Bool {
        isConfigured && !isSubmitting
    }

    func prepareAnonymousSessionIfNeeded() async {
        guard isConfigured, isAnonymousUser, !hasPreparedAnonymousSession else {
            return
        }

        hasPreparedAnonymousSession = true
        let result = await repository.ensureAnonymousSession()
        guard !result.ok else {
            return
        }

        status = .error
        message = result.message
    }

    func submit() async -> AuthEntryCompletion? {
        switch step {
        case .email:
            return await submitEmail(email)
        case .code:
            return await submitCode(code)
        }
    }

    @discardableResult
    func submitEmail(_ rawEmail: String? = nil) async -> AuthEntryCompletion? {
        let nextEmail = (rawEmail ?? email).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !nextEmail.isEmpty else {
            status = .error
            message = "친구들과 리뷰를 이어갈 이메일을 입력해 주세요."
            return nil
        }

        status = .submitting
        message = nil

        var effectiveIntent = intent
        var result = await repository.sendEmailOTP(
            email: nextEmail,
            intent: intent,
            shouldCreateUser: intent != .startWithEmail,
            redirectTo: redirectURL
        )

        if intent == .startWithEmail,
           isAnonymousUser,
           !result.ok,
           AuthEntryModel.isMissingSupabaseEmailAccountError(result.message) {
            effectiveIntent = .linkCurrentProfile
            result = await repository.sendEmailOTP(
                email: nextEmail,
                intent: effectiveIntent,
                shouldCreateUser: true,
                redirectTo: redirectURL
            )
        }

        status = result.ok ? .success : .error
        message = result.ok ? effectiveIntent.requestSuccessMessage : result.message

        guard result.ok else {
            return nil
        }

        intent = effectiveIntent
        pendingEmail = nextEmail
        email = nextEmail
        code = ""
        step = .code
        return nil
    }

    @discardableResult
    func submitCode(_ rawCode: String? = nil) async -> AuthEntryCompletion? {
        let nextCode = sanitizedCode(rawCode ?? code)
        code = nextCode

        guard let pendingEmail else {
            step = .email
            status = .error
            message = "먼저 이메일을 입력해 주세요."
            return nil
        }

        guard nextCode.count == 6 else {
            status = .error
            message = "이메일로 받은 6자리 코드를 입력해 주세요."
            return nil
        }

        status = .submitting
        message = nil

        let result = await repository.verifyEmailOTP(
            email: pendingEmail,
            token: nextCode,
            intent: intent,
            redirectTo: redirectURL
        )

        status = result.ok ? .success : .error
        message = result.message

        guard result.ok else {
            return nil
        }

        let verifiedIntent = intent
        resetAfterClose()
        return verifiedIntent == .linkCurrentProfile
            ? .linkedCurrentProfile
            : .verifiedEmailLogin(result)
    }

    func resendCode() async {
        guard let pendingEmail, !isSubmitting else {
            return
        }

        isCodeOptionOpen = false
        code = ""
        await submitEmail(pendingEmail)
    }

    func backToEmail() {
        isCancelConfirmOpen = false
        step = .email
        pendingEmail = nil
        status = .idle
        message = nil
        code = ""
    }

    func requestClose() -> Bool {
        guard step == .code else {
            return true
        }

        isCancelConfirmOpen = true
        return false
    }

    func confirmClose() {
        isCancelConfirmOpen = false
        resetAfterClose()
    }

    func cancelCloseConfirmation() {
        isCancelConfirmOpen = false
    }

    func continueAsGuest() -> AuthEntryCompletion {
        resetAfterClose()
        return .continueAsGuest
    }

    func devBypass() -> AuthEntryCompletion? {
        if intent == .startWithEmail {
            resetAfterClose()
            return .continueAsGuest
        }

        if step == .email {
            pendingEmail = "dev@tastebuddy.local"
            step = .code
            status = .success
            message = "개발용으로 인증 코드 입력 단계로 이동했습니다."
            return nil
        }

        let previousIntent = intent
        resetAfterClose()
        return previousIntent == .linkCurrentProfile
            ? .linkedCurrentProfile
            : .verifiedEmailLogin(.success("개발용 인증이 완료되었습니다."))
    }

    func setCode(_ rawCode: String) {
        code = sanitizedCode(rawCode)
    }

    private func resetAfterClose() {
        intent = .startWithEmail
        step = .email
        pendingEmail = nil
        status = .idle
        message = nil
        code = ""
        isCodeOptionOpen = false
        isCancelConfirmOpen = false
    }

    private func sanitizedCode(_ rawCode: String) -> String {
        String(rawCode.filter(\.isNumber).prefix(6))
    }

    static func isMissingSupabaseEmailAccountError(_ message: String?) -> Bool {
        let normalizedMessage = message?.lowercased() ?? ""
        return normalizedMessage.contains("signup")
            || normalizedMessage.contains("signups")
            || normalizedMessage.contains("not allowed")
            || normalizedMessage.contains("not found")
            || normalizedMessage.contains("no user")
    }
}

struct AuthEntrySheet: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var model: AuthEntryModel
    private let showsDevBypass: Bool
    private let onDismissRequest: (() -> Void)?
    private let onContinueAsGuest: () -> Void
    private let onVerifiedEmailLogin: (BackendAuthResult) -> Void
    private let onLinkedCurrentProfile: () -> Void

    init(
        intent: BackendAuthEmailIntent = .startWithEmail,
        repository: any BackendAuthRepository = BackendAuthRepositoryFactory.makeDefault(),
        isConfigured: Bool = BackendAuthRepositoryFactory.isConfigured(),
        isAnonymousUser: Bool = true,
        showsDevBypass: Bool = AuthEntryDebugBypass.isEnabled,
        onDismissRequest: (() -> Void)? = nil,
        onContinueAsGuest: @escaping () -> Void = {},
        onVerifiedEmailLogin: @escaping (BackendAuthResult) -> Void = { _ in },
        onLinkedCurrentProfile: @escaping () -> Void = {}
    ) {
        _model = StateObject(
            wrappedValue: AuthEntryModel(
                intent: intent,
                repository: repository,
                isConfigured: isConfigured,
                isAnonymousUser: isAnonymousUser
            )
        )
        self.showsDevBypass = showsDevBypass
        self.onDismissRequest = onDismissRequest
        self.onContinueAsGuest = onContinueAsGuest
        self.onVerifiedEmailLogin = onVerifiedEmailLogin
        self.onLinkedCurrentProfile = onLinkedCurrentProfile
    }

    var body: some View {
        BottomSheetShell(
            headerStart: headerStart,
            headerCenter: AnyView(headerTitle),
            headerEnd: headerEnd,
            footer: AnyView(footer),
            footerSafeAreaAccessory: footerSafeAreaAccessory,
            footerSafeAreaAccessoryHeight: AuthEntrySheetMetrics.secondaryActionsHeight(
                showsSkipAction: showsSkipAction,
                showsDevBypass: showsDevBypass
            ),
            floatingLayer: floatingLayer,
            stageMode: model.step == .code
                ? .fixed
                : .auto(maxHeightRatio: BottomSheetShellMetrics.authEntryEmailMaxHeightRatio),
            usesNativeSheetChrome: true
        ) {
            AuthEntryForm(model: model)
                .padding(.horizontal, TBSpacing.page)
                .padding(.top, 8)
                .padding(.bottom, 1)
        }
        .frame(height: presentationDetentHeight)
        .presentationDragIndicator(.hidden)
        .presentationBackground(Color.clear)
        .presentationCornerRadius(0)
        .presentationDetents([.height(presentationDetentHeight)])
        .prefersUISheetGrabberVisible(false)
        .task {
            await model.prepareAnonymousSessionIfNeeded()
        }
    }

    private var headerTitle: some View {
        Text(model.intent == .linkCurrentProfile ? "계정 연결" : "로그인")
            .font(TBFont.bold(16))
            .foregroundStyle(TBColor.textPrimary)
    }

    private var headerStart: AnyView? {
        if model.step == .code {
            return AnyView(
                BottomSheetIconButton(
                    ariaLabel: "이메일 입력으로 돌아가기",
                    icon: .chevronLeft,
                    action: model.backToEmail
                )
            )
        }

        return AnyView(
            BottomSheetCloseButton(action: dismissSheet)
        )
    }

    private var headerEnd: AnyView? {
        nil
    }

    private var footer: some View {
        PrimaryButton(
            title: model.footerButtonTitle,
            isEnabled: model.canSubmit,
            visualDisabled: !model.canSubmit
        ) {
            Task {
                let completion = await model.submit()
                handleCompletion(completion)
            }
        }
        .frame(height: AuthEntrySheetMetrics.primaryButtonHeight)
    }

    private var footerSafeAreaAccessory: AnyView? {
        guard showsSkipAction || showsDevBypass else {
            return nil
        }

        return AnyView(
            VStack(spacing: AuthEntrySheetMetrics.secondaryActionGap) {
                if showsSkipAction {
                    footerTextLink("나중에 하기") {
                        handleCompletion(model.continueAsGuest())
                    }
                }

                if showsDevBypass {
                    footerTextLink("개발용으로 인증 건너뛰기") {
                        handleCompletion(model.devBypass())
                    }
                }
            }
        )
    }

    private var showsSkipAction: Bool {
        model.step == .email && model.intent == .startWithEmail
    }

    private func footerTextLink(
        _ title: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(title)
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textFaint)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .frame(height: AuthEntrySheetMetrics.secondaryActionHeight)
        }
        .buttonStyle(.plain)
    }

    private var presentationDetentHeight: CGFloat {
        switch model.step {
        case .code:
            return BottomSheetShellMetrics.stageHeight(
                screenHeight: UIScreen.main.bounds.height,
                safeAreaTop: topSafeAreaInset
            )
        case .email:
            return AuthEntrySheetMetrics.emailPresentationHeight(
                showsSkipAction: showsSkipAction,
                showsDevBypass: showsDevBypass,
                showsMessage: model.message != nil,
                safeAreaBottom: bottomSafeAreaInset,
                screenHeight: UIScreen.main.bounds.height
            )
        }
    }

    private var topSafeAreaInset: CGFloat {
        keyWindowSafeAreaInsets.top
    }

    private var bottomSafeAreaInset: CGFloat {
        keyWindowSafeAreaInsets.bottom
    }

    private var keyWindowSafeAreaInsets: UIEdgeInsets {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }?
            .safeAreaInsets ?? .zero
    }

    private var floatingLayer: AnyView? {
        if model.isCancelConfirmOpen {
            return AnyView(cancelConfirmOverlay)
        }

        if model.isCodeOptionOpen {
            return AnyView(codeOptionOverlay)
        }

        return nil
    }

    private var cancelConfirmOverlay: some View {
        ActionOverlayCard(
            title: "취소하시겠습니까?",
            actions: [
                ActionOverlayCardAction(id: "confirm-close", label: "예, 종료하겠습니다") {
                    model.confirmClose()
                    dismissSheet()
                },
                ActionOverlayCardAction(id: "keep-going", label: "아니요, 계속 진행하겠습니다.") {
                    model.cancelCloseConfirmation()
                }
            ],
            onBackdropTap: model.cancelCloseConfirmation
        )
    }

    private var codeOptionOverlay: some View {
        ActionOverlayCard(
            title: "도움이 필요하세요?",
            actions: [
                ActionOverlayCardAction(
                    id: "resend-code",
                    label: "코드 다시 전송하기",
                    isDisabled: model.pendingEmail == nil || model.isSubmitting
                ) {
                    Task {
                        await model.resendCode()
                    }
                },
                ActionOverlayCardAction(id: "password-login", label: "비밀번호로 로그인하기"),
                ActionOverlayCardAction(id: "cancel", label: "취소") {
                    model.isCodeOptionOpen = false
                }
            ],
            onBackdropTap: {
                model.isCodeOptionOpen = false
            }
        )
    }

    private func requestClose() {
        if model.requestClose() {
            dismissSheet()
        }
    }

    private func handleCompletion(_ completion: AuthEntryCompletion?) {
        guard let completion else {
            return
        }

        dismissSheet()
        switch completion {
        case .continueAsGuest:
            onContinueAsGuest()
        case .verifiedEmailLogin(let result):
            onVerifiedEmailLogin(result)
        case .linkedCurrentProfile:
            onLinkedCurrentProfile()
        }
    }

    private func dismissSheet() {
        if let onDismissRequest {
            onDismissRequest()
        } else {
            dismiss()
        }
    }
}

private enum AuthEntrySheetMetrics {
    static let handleAndHeaderHeight: CGFloat =
        BottomSheetShellMetrics.topAreaHeightIncludingGrabber
        + BottomSheetShellMetrics.headerSlotSize
        + BottomSheetShellMetrics.headerBottomPadding
    static let emailFormHeight: CGFloat = 77
    static let footerTopPadding: CGFloat = BottomSheetShellMetrics.footerTopPadding
    static let primaryButtonHeight: CGFloat = TBSize.primaryButtonHeight
    static let secondaryActionHeight: CGFloat = 28
    static let secondaryActionGap: CGFloat = 12
    static let messageHeight: CGFloat = 44
    static let messageTopGap: CGFloat = 12

    static func secondaryActionsHeight(
        showsSkipAction: Bool,
        showsDevBypass: Bool
    ) -> CGFloat {
        let secondaryActionCount = [showsSkipAction, showsDevBypass].filter { $0 }.count
        guard secondaryActionCount > 0 else {
            return 0
        }

        return CGFloat(secondaryActionCount) * secondaryActionHeight
            + CGFloat(secondaryActionCount - 1) * secondaryActionGap
    }

    static func emailPresentationHeight(
        showsSkipAction: Bool,
        showsDevBypass: Bool,
        showsMessage: Bool,
        safeAreaBottom: CGFloat,
        screenHeight: CGFloat
    ) -> CGFloat {
        let secondaryActionsHeight = secondaryActionsHeight(
            showsSkipAction: showsSkipAction,
            showsDevBypass: showsDevBypass
        )
        let footerSafeAreaHeight = BottomSheetShellMetrics.footerSafeAreaHeight(
            safeAreaBottom: safeAreaBottom,
            accessoryHeight: secondaryActionsHeight > 0 ? secondaryActionsHeight : nil
        )
        let messagesHeight = CGFloat([showsMessage].filter { $0 }.count)
            * (messageHeight + messageTopGap)

        let contentHeight = handleAndHeaderHeight
            + emailFormHeight
            + messagesHeight
            + footerTopPadding
            + primaryButtonHeight
            + footerSafeAreaHeight

        return min(
            contentHeight,
            screenHeight * BottomSheetShellMetrics.authEntryEmailMaxHeightRatio
        )
    }
}

private struct AuthEntryForm: View {
    @ObservedObject var model: AuthEntryModel

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 12) {
                if model.step == .email {
                    emailField
                } else {
                    codeStep
                }
            }

            if let message = model.message {
                Text(message)
                    .font(TBFont.regular(12))
                    .foregroundStyle(model.status == .error ? TBColor.textSecondary : TasteAxis.sweet.tintTextColor)
                    .lineSpacing(3)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(model.status == .error ? TBColor.mutedSurface : TasteAxis.sweet.mainColor.opacity(0.05))
                    .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                    .padding(.top, 12)
            }

        }
        .frame(
            maxWidth: .infinity,
            maxHeight: model.step == .code ? .infinity : nil,
            alignment: model.step == .code ? .center : .topLeading
        )
    }

    private var emailField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("이메일")
                .font(TBFont.semibold(12))
                .foregroundStyle(TBColor.textMuted)

            TextField("이메일을 입력해주세요", text: $model.email)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .keyboardType(.emailAddress)
                .textContentType(.emailAddress)
                .font(TBFont.regular(14))
                .foregroundStyle(TBColor.textPrimary)
                .padding(.horizontal, 12)
                .frame(height: 48)
                .background(TBColor.surface)
                .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                        .stroke(TBColor.border, lineWidth: 1)
                }
                .disabled(model.isSubmitting)
        }
    }

    private var codeStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("이메일을 확인하세요.")
                    .font(TBFont.bold(18))
                    .foregroundStyle(TBColor.textPrimary)
                    .lineSpacing(2)

                Text("\(model.pendingEmail ?? "입력한 이메일")(으)로 인증 코드를 보냈습니다.")
                    .font(TBFont.regular(12))
                    .foregroundStyle(TBColor.textSubtle)
                    .lineSpacing(4)
            }

            AuthEntryOTPInput(
                code: Binding(
                    get: { model.code },
                    set: { model.setCode($0) }
                ),
                isDisabled: !model.isConfigured || model.isSubmitting
            )

            HStack(spacing: 4) {
                Text("코드를 받지 못했습니다.")
                    .font(TBFont.regular(11))
                    .foregroundStyle(TBColor.textFaint)

                Button {
                    model.isCodeOptionOpen = true
                } label: {
                    Text("옵션보기")
                        .font(TBFont.semibold(11))
                        .foregroundStyle(TBColor.textMuted)
                }
                .buttonStyle(.plain)
                .disabled(model.isSubmitting)
            }
            .lineSpacing(3)
        }
    }
}

private struct AuthEntryOTPInput: View {
    @Binding var code: String
    let isDisabled: Bool
    @FocusState private var isFocused: Bool

    var body: some View {
        ZStack(alignment: .leading) {
            HStack(spacing: 4) {
                ForEach(0..<6, id: \.self) { index in
                    Text(slotText(at: index))
                        .font(TBFont.semibold(16))
                        .foregroundStyle(TBColor.textPrimary)
                        .frame(width: 44, height: 48)
                        .background(TBColor.surface)
                        .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
                        .overlay {
                            RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                                .stroke(TBColor.border, lineWidth: 1)
                        }
                }
            }

            TextField("", text: Binding(
                get: { code },
                set: { code = String($0.filter(\.isNumber).prefix(6)) }
            ))
            .keyboardType(.numberPad)
            .textContentType(.oneTimeCode)
            .focused($isFocused)
            .foregroundStyle(.clear)
            .tint(.clear)
            .frame(width: 284, height: 48)
            .background(Color.clear)
            .disabled(isDisabled)
        }
        .contentShape(Rectangle())
        .onTapGesture {
            guard !isDisabled else {
                return
            }

            isFocused = true
        }
        .accessibilityLabel("이메일 인증 코드")
        .accessibilityValue(code)
    }

    private func slotText(at index: Int) -> String {
        let characters = Array(code)
        guard index < characters.count else {
            return ""
        }

        return String(characters[index])
    }
}

struct AuthEntryPreviewHost: View {
    @State private var showsSheet = true

    var body: some View {
        TBColor.page
            .ignoresSafeArea()
            .sheet(isPresented: $showsSheet) {
                AuthEntrySheet(
                    intent: .linkCurrentProfile,
                    repository: FixtureBackendAuthRepository(),
                    isConfigured: true,
                    showsDevBypass: true
                )
            }
    }
}

#if canImport(PreviewsMacros)
    #Preview("Auth Entry Sheet") {
        AuthEntryPreviewHost()
    }
#endif
