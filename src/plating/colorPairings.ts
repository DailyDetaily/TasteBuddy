import { IOS_FOUNDATIONS } from "./foundationReferenceData";
import { nativeColorForMode, TASTE_PALETTES_BY_MODE } from "../constants/colorModes";
import { type ColorMode } from "../constants/designTokens";

export const stateColorPairs = [
  { name: "중립", foreground: "neutral", background: "neutralSoft", message: "식사 메모를 남길 수 있어요." },
  { name: "정보", foreground: "informative", background: "informativeSoft", message: "추가 정보를 확인해 주세요." },
  { name: "성공", foreground: "successText", background: "successSoft", message: "식사 기록을 저장했어요." },
  { name: "주의", foreground: "warningText", background: "warningSoft", message: "저장하지 않은 내용이 있어요." },
  { name: "오류", foreground: "destructiveText", background: "destructiveSoft", message: "저장하지 못했어요. 다시 시도해 주세요." },
] as const;

/** WCAG relative luminance for opaque sRGB colors. */
export function colorContrast(foreground: string, background: string) {
  const luminance = (hex: string) => {
    if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error("Contrast requires an opaque six-digit HEX color");
    return [1, 3, 5].map((offset) => {
      const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function documentedColorPairs(mode: ColorMode = 'light') {
  const nativeColor = (name: string) => nativeColorForMode(name, mode);
  return [
    ...stateColorPairs.map(pair => ({ name: pair.name, foreground: nativeColor(pair.foreground), background: nativeColor(pair.background) })),
    { name: "본문", foreground: nativeColor("textBody"), background: nativeColor("page") },
    { name: "입력 힌트", foreground: nativeColor("textHint"), background: nativeColor("surface") },
    { name: "주요 행동", foreground: nativeColor("actionOnPrimary"), background: nativeColor("actionPrimary") },
    { name: "선택", foreground: nativeColor("selectionText"), background: nativeColor("selectionSurface") },
    { name: "성공 채움", foreground: nativeColor("textInverse"), background: nativeColor("successStrong") },
    { name: "주의 채움", foreground: nativeColor("textInverse"), background: nativeColor("warningStrong") },
    ...IOS_FOUNDATIONS.tastes.map(taste => {
      const palette = TASTE_PALETTES_BY_MODE[mode][taste.id as keyof typeof TASTE_PALETTES_BY_MODE.light];
      return { name: taste.label, foreground: palette.tintSurfaceText, background: palette.tintSurface };
    }),
  ];
}
