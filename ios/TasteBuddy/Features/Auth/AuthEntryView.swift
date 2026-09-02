import SwiftUI
import UIKit

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

    var showsGoogleAction: Bool {
        step == .email && intent == .startWithEmail
    }

    var canContinueWithGoogle: Bool {
        isConfigured && !isSubmitting && showsGoogleAction
    }

    func prepareAnonymousSessionIfNeeded() async {
        guard intent == .linkCurrentProfile,
              isConfigured,
              isAnonymousUser,
              !hasPreparedAnonymousSession else {
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
    func continueWithGoogle() async -> AuthEntryCompletion? {
        guard canContinueWithGoogle else {
            return nil
        }

        status = .submitting
        message = nil

        let result = await repository.continueWithGoogle(redirectTo: redirectURL)

        status = result.ok ? .success : .error
        message = result.message

        guard result.ok else {
            return nil
        }

        resetAfterClose()
        return .verifiedEmailLogin(result)
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

        let result = await repository.sendEmailOTP(
            email: nextEmail,
            intent: intent,
            shouldCreateUser: true,
            redirectTo: redirectURL
        )

        status = result.ok ? .success : .error
        message = result.ok ? intent.requestSuccessMessage : result.message

        guard result.ok else {
            return nil
        }

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

}

struct AuthEntrySheet: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var model: AuthEntryModel
    @StateObject private var keyboard = AuthEntryKeyboardAvoidanceObserver()
    private let showsDevBypass: Bool
    private let prefersFullHeight: Bool
    private let usesNativeSheetChrome: Bool
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
        prefersFullHeight: Bool = false,
        usesNativeSheetChrome: Bool = true,
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
                isAnonymousUser: isAnonymousUser,
                redirectURL: BackendAuthRepositoryFactory.authRedirectURL()
            )
        )
        self.showsDevBypass = showsDevBypass
        self.prefersFullHeight = prefersFullHeight
        self.usesNativeSheetChrome = usesNativeSheetChrome
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
                showsSkipAction: false,
                showsDevBypass: showsDevelopmentBypassAccessory
            ),
            footerKeyboardOffset: 0,
            floatingLayer: floatingLayer,
            stageMode: prefersFullHeight || model.step == .code
                ? .fixed
                : .auto(maxHeightRatio: BottomSheetShellMetrics.authEntryEmailMaxHeightRatio),
            usesNativeSheetChrome: usesNativeSheetChrome
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
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .background {
            KeyboardDismissTapInstaller(isEnabled: keyboard.visibleHeight > 0) {
                dismissKeyboard()
            }
        }
        .task {
            await model.prepareAnonymousSessionIfNeeded()
        }
    }

    private var headerTitle: some View {
        Text(model.intent == .linkCurrentProfile ? "계정 연결" : "시작하기")
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
        VStack(spacing: AuthEntrySheetMetrics.secondaryActionGap) {
            primaryActionButton
                .offset(y: primaryActionKeyboardOffset)
                .animation(.easeOut(duration: 0.24), value: keyboard.visibleHeight)
                .zIndex(1)

            if showsSkipAction {
                footerTextLink("나중에 하기") {
                    handleCompletion(model.continueAsGuest())
                }
            }

            if model.showsGoogleAction {
                AuthEntryDividerLabel(title: "또는")

                GoogleAuthButton(
                    isEnabled: model.canContinueWithGoogle
                ) {
                    Task {
                        let completion = await model.continueWithGoogle()
                        handleCompletion(completion)
                    }
                }
            }
        }
    }

    private var primaryActionButton: some View {
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
    }

    private var footerSafeAreaAccessory: AnyView? {
        guard showsDevelopmentBypassAccessory else {
            return nil
        }

        return AnyView(
            footerTextLink("개발용으로 인증 건너뛰기") {
                handleCompletion(model.devBypass())
            }
        )
    }

    private var showsSkipAction: Bool {
        model.step == .email && model.intent == .startWithEmail
    }

    private var showsDevelopmentBypassAccessory: Bool {
        showsDevBypass && !showsSkipAction
    }

    private var primaryActionKeyboardOffset: CGFloat {
        guard keyboard.visibleHeight > 0 && model.step == .email else {
            return 0
        }

        let removedFooterHeight = footerSafeAreaHeight
            + AuthEntrySheetMetrics.actionsBelowPrimaryHeight(
                showsSkipAction: showsSkipAction,
                showsGoogleAction: model.showsGoogleAction
            )
            - AuthEntrySheetMetrics.keyboardPrimaryActionGap

        return min(0, -keyboard.visibleHeight + removedFooterHeight)
    }

    private var footerSafeAreaHeight: CGFloat {
        let accessoryHeight = showsDevelopmentBypassAccessory
            ? AuthEntrySheetMetrics.secondaryActionsHeight(
                showsSkipAction: false,
                showsDevBypass: true
            )
            : nil

        return BottomSheetShellMetrics.footerSafeAreaHeight(
            safeAreaBottom: bottomSafeAreaInset,
            accessoryHeight: accessoryHeight
        )
    }

    private func footerTextLink(
        _ title: String,
        action: @escaping () -> Void
    ) -> some View {
        AuthTextActionButton(title: title, action: action)
    }

    private var presentationDetentHeight: CGFloat {
        if prefersFullHeight {
            return BottomSheetShellMetrics.stageHeight(
                screenHeight: UIScreen.main.bounds.height,
                safeAreaTop: topSafeAreaInset
            )
        }

        switch model.step {
        case .code:
            return BottomSheetShellMetrics.stageHeight(
                screenHeight: UIScreen.main.bounds.height,
                safeAreaTop: topSafeAreaInset
            )
        case .email:
            return AuthEntrySheetMetrics.emailPresentationHeight(
                showsSkipAction: showsSkipAction,
                showsDevBypass: showsDevelopmentBypassAccessory,
                showsGoogleAction: model.showsGoogleAction,
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

    private func dismissKeyboard() {
        UIApplication.shared.sendAction(
            #selector(UIResponder.resignFirstResponder),
            to: nil,
            from: nil,
            for: nil
        )
    }
}

private enum AuthEntrySheetMetrics {
    static let handleAndHeaderHeight: CGFloat =
        BottomSheetShellMetrics.headerSlotSize
        + BottomSheetShellMetrics.headerTopPadding
        + BottomSheetShellMetrics.headerBottomPadding
    static let emailFormHeight: CGFloat = 77
    static let footerTopPadding: CGFloat = BottomSheetShellMetrics.footerTopPadding
    static let primaryButtonHeight: CGFloat = TBSize.primaryButtonHeight
    static let secondaryActionHeight: CGFloat = 28
    static let secondaryActionGap: CGFloat = 12
    static let dividerLabelHeight: CGFloat = 14
    static let googleButtonHeight: CGFloat = 48
    static let keyboardPrimaryActionGap: CGFloat = TBSpacing.x12
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

    static func footerActionsHeight(
        showsSkipAction: Bool,
        showsGoogleAction: Bool
    ) -> CGFloat {
        primaryButtonHeight + actionsBelowPrimaryHeight(
            showsSkipAction: showsSkipAction,
            showsGoogleAction: showsGoogleAction
        )
    }

    static func actionsBelowPrimaryHeight(
        showsSkipAction: Bool,
        showsGoogleAction: Bool
    ) -> CGFloat {
        var height: CGFloat = 0

        if showsSkipAction {
            height += secondaryActionGap + secondaryActionHeight
        }

        if showsGoogleAction {
            height += secondaryActionGap
                + dividerLabelHeight
                + secondaryActionGap
                + googleButtonHeight
        }

        return height
    }

    static func emailPresentationHeight(
        showsSkipAction: Bool,
        showsDevBypass: Bool,
        showsGoogleAction: Bool,
        showsMessage: Bool,
        safeAreaBottom: CGFloat,
        screenHeight: CGFloat
    ) -> CGFloat {
        let accessoryActionsHeight = secondaryActionsHeight(
            showsSkipAction: false,
            showsDevBypass: showsDevBypass
        )
        let footerSafeAreaHeight = BottomSheetShellMetrics.footerSafeAreaHeight(
            safeAreaBottom: safeAreaBottom,
            accessoryHeight: accessoryActionsHeight > 0 ? accessoryActionsHeight : nil
        )
        let messagesHeight = CGFloat([showsMessage].filter { $0 }.count)
            * (messageHeight + messageTopGap)
        let footerActionsHeight = footerActionsHeight(
            showsSkipAction: showsSkipAction,
            showsGoogleAction: showsGoogleAction
        )

        let contentHeight = handleAndHeaderHeight
            + emailFormHeight
            + messagesHeight
            + footerTopPadding
            + footerActionsHeight
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
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(model.status == .error ? TBColor.mutedSurface : TasteAxis.sweet.tintSoftColor)
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

            ZStack(alignment: .leading) {
                if model.email.isEmpty {
                    Text("이메일을 입력해주세요")
                        .font(TBFont.regular(14))
                        .foregroundStyle(TBColor.textHint)
                        .padding(.horizontal, 12)
                        .allowsHitTesting(false)
                }

                TextField("", text: $model.email)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .font(TBFont.regular(14))
                    .foregroundStyle(TBColor.textPrimary)
                    .padding(.horizontal, 12)
            }
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
                        .foregroundStyle(model.isSubmitting ? TBColor.textDisabled : TBColor.textMuted)
                }
                .buttonStyle(.plain)
                .disabled(model.isSubmitting)
            }
            .lineSpacing(3)
        }
    }
}

private struct GoogleAuthButton: View {
    let isEnabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                GoogleGlyph(color: isEnabled ? TBColor.textPrimary : TBColor.textDisabled)

                Text("Google로 계속하기")
                    .font(TBFont.semibold(14))
                    .foregroundStyle(isEnabled ? TBColor.textPrimary : TBColor.textDisabled)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(isEnabled ? TBColor.surface : TBColor.disabledSurface)
            .clipShape(RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: TBRadius.row, style: .continuous)
                    .stroke(isEnabled ? TBColor.border : TBColor.borderDisabled, lineWidth: 1)
            }
        }
        .buttonStyle(TBTokenButtonStyle())
        .disabled(!isEnabled)
        .accessibilityLabel("Google로 계속하기")
    }
}

private struct GoogleGlyph: View {
    var color = TBColor.textPrimary

    var body: some View {
        Text("G")
            .font(.system(size: 15, weight: .semibold, design: .rounded))
            .foregroundStyle(color)
            .frame(width: 22, height: 22)
            .background(TBColor.mutedSurface)
            .clipShape(Circle())
            .accessibilityHidden(true)
    }
}

private struct AuthEntryDividerLabel: View {
    let title: String

    var body: some View {
        HStack(spacing: 10) {
            Rectangle()
                .fill(TBColor.border)
                .frame(height: 1)

            Text(title)
                .font(TBFont.regular(11))
                .foregroundStyle(TBColor.textFaint)
                .fixedSize(horizontal: true, vertical: false)

            Rectangle()
                .fill(TBColor.border)
                .frame(height: 1)
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

private struct KeyboardDismissTapInstaller: UIViewRepresentable {
    let isEnabled: Bool
    let onDismiss: () -> Void

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.isUserInteractionEnabled = false
        attachRecognizerIfPossible(from: view, coordinator: context.coordinator)
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        context.coordinator.isEnabled = isEnabled
        context.coordinator.onDismiss = onDismiss
        attachRecognizerIfPossible(from: uiView, coordinator: context.coordinator)
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
        coordinator.detach()
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(isEnabled: isEnabled, onDismiss: onDismiss)
    }

    private func attachRecognizerIfPossible(from view: UIView, coordinator: Coordinator) {
        DispatchQueue.main.async {
            guard let window = view.window else {
                return
            }

            coordinator.attach(to: window)
        }
    }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        var isEnabled: Bool
        var onDismiss: () -> Void
        private weak var installedWindow: UIWindow?
        private lazy var recognizer: UITapGestureRecognizer = {
            let recognizer = UITapGestureRecognizer(target: self, action: #selector(handleTap))
            recognizer.cancelsTouchesInView = false
            recognizer.delegate = self
            return recognizer
        }()

        init(isEnabled: Bool, onDismiss: @escaping () -> Void) {
            self.isEnabled = isEnabled
            self.onDismiss = onDismiss
        }

        func attach(to window: UIWindow) {
            guard installedWindow !== window else {
                return
            }

            detach()
            installedWindow = window
            window.addGestureRecognizer(recognizer)
        }

        func detach() {
            installedWindow?.removeGestureRecognizer(recognizer)
            installedWindow = nil
        }

        @objc private func handleTap() {
            guard isEnabled else {
                return
            }

            onDismiss()
        }

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldReceive touch: UITouch
        ) -> Bool {
            isEnabled && !touchTargetsTextInput(touch.view)
        }

        private func touchTargetsTextInput(_ view: UIView?) -> Bool {
            var current = view

            while let candidate = current {
                if candidate is UITextField || candidate is UITextView {
                    return true
                }

                let typeName = String(describing: type(of: candidate))
                if typeName.contains("TextField") || typeName.contains("TextView") {
                    return true
                }

                current = candidate.superview
            }

            return false
        }
    }
}

@MainActor
private final class AuthEntryKeyboardAvoidanceObserver: NSObject, ObservableObject {
    @Published private(set) var visibleHeight: CGFloat = 0

    override init() {
        super.init()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleKeyboardNotification),
            name: UIResponder.keyboardWillChangeFrameNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleKeyboardNotification),
            name: UIResponder.keyboardWillHideNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func handleKeyboardNotification(_ notification: Notification) {
        let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double ?? 0.24
        let keyboardFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect ?? .zero
        let nextHeight = Self.visibleKeyboardHeight(for: keyboardFrame)

        withAnimation(.easeOut(duration: duration)) {
            visibleHeight = nextHeight
        }
    }

    private static func visibleKeyboardHeight(for keyboardFrame: CGRect) -> CGFloat {
        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap(\.windows)
            .first(where: \.isKeyWindow) else {
            return 0
        }

        let keyboardFrameInWindow = window.convert(keyboardFrame, from: nil)
        let overlap = window.bounds.maxY - keyboardFrameInWindow.minY
        return max(0, overlap)
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
