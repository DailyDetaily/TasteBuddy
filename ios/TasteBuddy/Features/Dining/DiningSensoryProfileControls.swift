import SwiftUI

struct DiningSensoryProfileControls: View {
    let catalog: DiningSensoryV2Catalog
    let presentation: DiningSensoryPresentation
    let onChange: ([String]?, [String: String]) -> Void

    var body: some View {
        HStack(spacing: 12) {
            Menu {
                Button("메뉴 이름으로 자동 선택") { onChange(nil, presentation.flagOverrides) }
                Button("공통 표현") { onChange([], presentation.flagOverrides) }
                ForEach(catalog.profiles.filter { $0.id != "generic" }) { profile in
                    Button(profile.label) { onChange([profile.id], presentation.flagOverrides) }
                }
            } label: {
                HStack(spacing: 5) {
                    Text(presentation.profileIds.compactMap { id in catalog.profiles.first { $0.id == id }?.label }.joined(separator: " · "))
                        .lineLimit(1)
                    Image(systemName: "chevron.down")
                }
                .font(TBFont.semibold(12))
            }
            .accessibilityLabel("음식별 미각 표현 종류")
            Spacer(minLength: 0)
            Menu {
                ForEach(catalog.contextFlags) { flag in
                    Button {
                        var overrides = presentation.flagOverrides
                        overrides[flag.id] = presentation.contextFlags[flag.id] == "confirmed" ? "explicitly_rejected" : "confirmed"
                        onChange(presentation.profileSelection, overrides)
                    } label: {
                        if presentation.contextFlags[flag.id] == "confirmed" { Label(flag.label, systemImage: "checkmark") }
                        else { Text(flag.label) }
                    }
                }
                Divider()
                Button("자동 확인으로 되돌리기") { onChange(presentation.profileSelection, [:]) }
            } label: {
                Text("음식 구성 확인")
                    .font(TBFont.semibold(12))
            }
        }
        .foregroundStyle(TBColor.textSecondary)
        .frame(minHeight: 44)
    }
}
