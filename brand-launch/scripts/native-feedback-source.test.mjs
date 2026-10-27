import assert from "node:assert/strict";
import test from "node:test";
import { themeColors } from "./native-feedback/source.mjs";

const theme = `
enum TBLightColor {
    static let surface = Color.white
    static let textPrimary = Color(hex: 0x203040)
    static let textAlias = textPrimary
}
enum TBDarkColor {
    static let surface = Color(hex: 0x171717)
    static let textPrimary = Color.white.opacity(0.8)
    static let textAlias = TBDarkColor.textPrimary
}
enum TBColor {
    static let surface = Color.tbAdaptive(light: TBLightColor.surface, dark: TBDarkColor.surface)
    static let textPrimary = Color.tbAdaptive(light: TBLightColor.textAlias, dark: TBDarkColor.textAlias)
    static let comparison = Color.tbAdaptive(light: Color(hex: 0x666666, alpha: 0.18), dark: Color(hex: 0x454545))
    static let alias: Color = TBColor.textPrimary
    static let scrim = Color.black.opacity(0.2)
}
`;

test("adaptive colors resolve light and dark namespaces, aliases and inline alpha", () => {
  assert.deepEqual(themeColors(theme), {
    surface: "#FFFFFF", textPrimary: "#203040", comparison: "#6666662E",
    alias: "#203040", scrim: "#00000033",
  });
  assert.deepEqual(themeColors(theme, "dark"), {
    surface: "#171717", textPrimary: "#FFFFFFCC", comparison: "#454545",
    alias: "#FFFFFFCC", scrim: "#00000033",
  });
});

test("unselected appearance edits cannot change the authored light film", () => {
  const changed = theme.replace("0x171717", "0x112233");
  assert.deepEqual(themeColors(changed), themeColors(theme));
  assert.equal(themeColors(changed, "dark").surface, "#112233");
});

test("missing, cyclic and unsupported colors fail instead of publishing partial values", () => {
  assert.throws(() => themeColors(theme.replace("TBLightColor.surface", "TBLightColor.missing")), /색상 토큰 없음/);
  assert.throws(() => themeColors("enum TBColor {\nstatic let a = b\nstatic let b = a\n}"), /순환 색상 토큰/);
  assert.throws(() => themeColors("enum TBColor {\nstatic let a = Color.red\n}"), /지원하지 않는 색상/);
  assert.throws(() => themeColors(theme, "system"), /색상 모드/);
  assert.throws(() => themeColors(theme.replace("alpha: 0.18", "alpha: 1.8")), /색상 알파/);
});
