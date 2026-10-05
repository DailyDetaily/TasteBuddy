import { nativeFeedback } from "../generated/native-feedback";
export const nativeFlowUI = nativeFeedback.ui;
export const nativeColors = nativeFeedback.colors;
export const nativeChip = nativeFeedback.chip;
export const nativeBubble = nativeFeedback.bubble;
export const nativeTextArea = nativeFeedback.textArea;
export const nativeControls = nativeFeedback.controls;

export const nativeText = (text: string, scope?: string): string => {
  const dictionaries = nativeFeedback.copy as Record<
    string,
    Record<string, string>
  >;
  const key = text.replace(/\s+/g, " ").trim();
  if (scope && dictionaries[scope]?.[key]) return dictionaries[scope][key];
  const values = [
    ...new Set(
      Object.values(dictionaries).flatMap((d) => (d[key] ? [d[key]] : [])),
    ),
  ];
  return values.length === 1 ? values[0] : text;
};
