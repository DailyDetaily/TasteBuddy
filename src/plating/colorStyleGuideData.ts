import { TASTE_IDS, TASTE_TOKENS, TASTE_TINTS_BY_MODE, TASTE_TINT_STEPS, type ColorMode } from "../constants/designTokens";
import { COLOR_TOKENS_BY_MODE, TASTE_PALETTES_BY_MODE } from "../constants/colorModes";
import { nativeColor } from "./foundationReferenceData";
import { colorContrast } from "./colorPairings";

export const COLOR_GUIDE_VERSION = "2026-10-12";
export const COLOR_GUIDE_RULES = [
  { title: "미각은 색으로 구분", body: "6가지 미각은 Light·Dark에서 같은 원색을 사용하며 배경과 글자의 역할별 밝기를 조정해요. 강도는 크기·위치·수치로, 호감은 별도의 응답으로 표현해요." },
  { title: "UI는 역할로 선택", body: "페이지·카드·글자·경계·상태를 먼저 고르고 토큰을 사용해요. 같은 HEX여도 서로 다른 역할은 이름을 분리해요." },
  { title: "옅은 채움은 80 / 70", body: "카드·톤 버튼·태그·선택 탭은 Light tint/80, Dark tint/70을 사용해요. 채움 위 경계는 70/60, 선택·추천 경계는 60/50이며 글자는 tintSurfaceText를 함께 사용해요." },
  { title: "배경과 글자는 한 쌍", body: "미각 배경 tintSurface에는 tintSurfaceText를 사용해요. main은 분류와 그래픽의 강조색이고, 작은 글자의 기본값은 아니에요." },
  { title: "혼합 팔레트에서 역할로 연결", body: "Light는 흰색, Dark는 #1C1C1C를 10–95% 섞어요. 숫자는 기준색 비율이며, 결과는 불투명해요. 캡슐 막대 트랙과 옅은 UI 채움은 Light tint/80 · Dark tint/70을 사용해요." },
] as const;

export const COLOR_GUIDE_MIGRATION = [
  { subject: "신맛 대표색", legacy: "TB Sour #FFD600", decision: "#FFD600으로 복원. 기존 TB 스타일·변수와 Sour 톤 견본도 같은 원색으로 계산해요." },
  { subject: "쓴맛", legacy: "스타일 #95C900 / 변수 #B2CC44", decision: "현재 대표색 #95C900을 채택해요. 이전 변수의 다른 색은 새 UI에 사용하지 않아요." },
  { subject: "성공", legacy: "스타일 #43C900 / 변수 #9ACA16", decision: "현재 success #2F8F5B, 읽기용 successText #236B45를 사용해요. 쓴맛과 의미를 분리해요." },
  { subject: "주의·오류", legacy: "주의 #FF9900 / 오류 #E51919", decision: "현재 warning #A8661A / destructive #D4183D를 사용해요. 작은 글자는 각 Text 토큰을 선택해요." },
  { subject: "30%와 Color BG 20%", legacy: "이름에 %가 있지만 alpha는 100%", decision: "이전 이름은 이력으로 보존해요. 새 UI는 모드별 기준색 혼합 단계와 이를 참조하는 역할 토큰을 사용해요." },
  { subject: "Surface·Fill·Label 단계", legacy: "01·02 번호와 여러 페인트를 겹친 구조", decision: "페이지·카드·본문·힌트처럼 실제 역할에 연결해요. 밝기 번호를 UI 위계와 동일시하지 않아요." },
  { subject: "Line·Dimmer", legacy: "Light Line 03·04가 동일한 50%; 딤 50%·60% 불일치", decision: "경계는 border 계열, 딤은 검정 35%·50%·60%를 사용해요. 기존 Dark 흰색 딤은 채택하지 않아요." },
  { subject: "힌트·아이콘·페이지", legacy: "웹 힌트 #888888, Figma 아이콘 #0F0F0F, 페이지 이름 surface/base", decision: "힌트 #6F6F6F, 아이콘 #3F3F3F로 정렬했어요. Figma 페이지는 bg/page, 흰 표면은 surface/base로 분리해요." },
  { subject: "Dark", legacy: "기존 TB에 별도 Dark 참고값이 있어요", decision: "새 Dark 스타일은 #1C1C1C 혼합 팔레트와 역할별 값으로 정의해요. 이전 Dark 값은 이력으로 보존해요." },
] as const;

export const colorGuideTastes = (mode: ColorMode) => TASTE_IDS.map(id => {
  const palette = TASTE_PALETTES_BY_MODE[mode][id];
  return { id, label: TASTE_TOKENS[id].label, ...palette, tints: TASTE_TINTS_BY_MODE[mode][id], contrast: colorContrast(palette.tintSurfaceText, palette.tintSurface), mainContrast: colorContrast(palette.main, COLOR_TOKENS_BY_MODE[mode].surface.base) };
});
export const COLOR_GUIDE_TASTES = colorGuideTastes('light');

export const COLOR_GUIDE_NEUTRALS = [
  { title: "페이지와 표면", names: ["page", "surface", "mutedSurface", "elevatedSurface", "disabledSurface", "inverseSurface"] },
  { title: "읽기 위계", names: ["textPrimary", "textSecondary", "textTertiary", "textBody", "textHint", "textDisabled"] },
  { title: "경계와 아이콘", names: ["borderCard", "border", "borderStrong", "iconPrimary", "iconHover", "iconMuted"] },
].map(group => ({ ...group, colors: group.names.map(name => ({ name, value: nativeColor(name) })) }));

export const COLOR_GUIDE_STATES = ["success", "warning", "destructive"].map(name => ({
  name, main: nativeColor(name), text: nativeColor(name + "Text"), surface: nativeColor(name + "Soft"),
  contrast: colorContrast(nativeColor(name + "Text"), nativeColor(name + "Soft")),
}));

export const COLOR_GUIDE_INTERACTIONS = ["actionPrimary", "actionOnPrimary", "selectionSurface", "selectionText", "focusRing", "hoverOverlay", "pressedOverlay", "pressedInverseOverlay", "scrimSubtle", "scrimDefault", "scrimStrong"]
  .map(name => ({ name, value: nativeColor(name) }));

export { TASTE_TINT_STEPS as COLOR_GUIDE_TINT_STEPS };
