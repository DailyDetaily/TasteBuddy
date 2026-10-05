import { smoothStep } from "./motion";

export const BUBBLE_INTRO_SECONDS = 1.8;
export const DETAIL_SCROLL_CUES = [
  { target: "page", start: 0.65, end: 1.75, distance: 300 },
  { target: "balance", start: 2, end: 2.75, distance: 1 },
  { target: "flow", start: 3, end: 3.75, distance: 1 },
  { target: "texture", start: 4, end: 4.75, distance: 1 },
  { target: "page", start: 5.8, end: 6.65, distance: 260 },
  { target: "aroma", start: 6.95, end: 7.7, distance: 1 },
  { target: "composition", start: 8.75, end: 9.5, distance: 1 },
] as const;
export const DETAIL_SELECTION_SECONDS = { texture: 5.1, aroma: 8.05 } as const;

export const detailScrollState = (seconds: number) => {
  const state: Record<string, number> = {};
  for (const cue of DETAIL_SCROLL_CUES) {
    const progress = smoothStep((seconds - cue.start) / (cue.end - cue.start));
    state[cue.target] = (state[cue.target] ?? 0) + cue.distance * progress;
  }
  return state;
};

export const feedbackStages = [
  { id: "restaurant", name: "식당 선택", seconds: 3.2 },
  { id: "menu", name: "메뉴 선택", seconds: 3.5 },
  { id: "overall", name: "전체 평가", seconds: 3 },
  { id: "bubbles", name: "미각 버블 선택", seconds: 5 + BUBBLE_INTRO_SECONDS },
  { id: "details", name: "디테일 기록", seconds: 10.5 },
  { id: "note", name: "미식 노트", seconds: 3.2 },
  { id: "result", name: "결과 카드", seconds: 5 },
] as const;
export type FeedbackStage = (typeof feedbackStages)[number]["id"];
export const feedbackTiming = (fps: number) => {
  let cursor = 0;
  const stages = feedbackStages.map((stage) => {
    const from = cursor;
    const duration = Math.round(stage.seconds * fps);
    cursor += duration;
    return { ...stage, from, duration };
  });
  return { stages, durationInFrames: cursor };
};
