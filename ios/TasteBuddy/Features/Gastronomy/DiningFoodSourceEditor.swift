import SwiftUI

/// Optional source selection in the existing creation/correction flows.
struct DiningFoodSourceEditor: View {
    @EnvironmentObject private var appModel: AppModel
    @Binding var value: DiningFoodSource?
    private var recipes: [(id: String, name: String)] {
        var names: [String: String] = [:]
        for entry in appModel.diningEntries where entry.foodSource?.kind == "homeCooked" {
            if let id = entry.foodSource?.homeCookingID, !id.isEmpty, names[id] == nil { names[id] = entry.menu }
        }
        return names.map { (id: $0.key, name: $0.value) }.sorted { $0.name == $1.name ? $0.id < $1.id : $0.name < $1.name }
    }
    var body: some View {
        DisclosureGroup("음식 출처 · 선택 사항") {
            Picker("음식 출처", selection: Binding(get: { value?.kind ?? "unknown" }, set: { kind in
                var next = value ?? .init(); next.kind = kind
                if kind != "homeCooked" { next.homeCookingID = nil }
                value = next
            })) {
                Text("출처 미확인").tag("unknown")
                Text("식당 음식").tag("restaurant")
                Text("직접 만든 요리").tag("homeCooked")
                if let kind = value?.kind, !["unknown", "restaurant", "homeCooked"].contains(kind) { Text("확인되지 않은 출처").tag(kind) }
            }.pickerStyle(.menu)
            if value?.kind == "homeCooked" {
                Picker("같은 요리 연결", selection: Binding(get: { value?.homeCookingID ?? "" }, set: { id in
                    var next = value ?? .init(kind: "homeCooked"); next.homeCookingID = id.isEmpty ? nil : id; value = next
                })) {
                    Text("요리 연결 미확인").tag("")
                    ForEach(recipes, id: \.id) { Text($0.name.isEmpty ? "이름 미확인 요리" : $0.name).tag($0.id) }
                    if let id = value?.homeCookingID, !recipes.contains(where: { $0.id == id }) { Text("새로 연결한 요리").tag(id) }
                }.pickerStyle(.menu)
                Button("새로운 직접 만든 요리로 연결") {
                    var next = value ?? .init(kind: "homeCooked"); next.homeCookingID = UUID().uuidString; value = next
                }.frame(minHeight: 44)
                Text("같은 요리로 연결한 기록만 메뉴 수와 반복 경험에 함께 묶어요.").tbTextStyle(.caption)
            }
        }
        .accessibilityIdentifier("dining-food-source")
    }
}
