import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const cameraEntrySchema = z.object({
  "캔버스 배경": zColor(),
  "화면 높이": z.number().min(720).max(1120).step(20),
  "클릭 전 대기": z.number().min(0).max(8).step(0.1),
  "누름 시간": z.number().min(0.08).max(1).step(0.02),
  "진입 속도": z.number().min(0.25).max(2).step(0.05),
  "카메라 유지 시간": z.number().min(0.5).max(8).step(0.1),
  "버튼 크기": z.number().min(96).max(240).step(6),
  "하단 여백": z.number().min(120).max(420).step(6),
  "컬러 모드": z.enum(["블루 · 퍼플", "블루 · 옐로우", "6색 랜덤"]),
  "색 전환 간격": z.number().min(0.25).max(3).step(0.05),
  "랜덤 시드": z
    .number()
    .int()
    .min(0)
    .max(999999)
    .describe("값을 바꾸면 새로운 색상 순서가 만들어집니다."),
  "글래스 강도": z.number().min(0).max(1.5).step(0.05),
  "배경 색": zColor(),
});

export type CameraEntryProps = z.infer<typeof cameraEntrySchema>;
