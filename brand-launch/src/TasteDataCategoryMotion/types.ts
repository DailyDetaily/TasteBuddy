export const categories = [
  "experienceCluster",
  "sensoryRays",
  "preferenceFocus",
  "contextLayers",
  "changeRipples",
] as const;
export type Category = (typeof categories)[number];
export type State = "valid" | "noData" | "unanswered" | "held" | "unlinked";
export type Mode = "liking" | "fit" | "overall";
export type Playback = "intro" | "idle" | "reduced";
export type Scenario =
  | "standard"
  | "empty"
  | "dense"
  | "zero"
  | "unanswered"
  | "held"
  | "decrease"
  | "equal"
  | "unlinked"
  | "added"
  | "small"
  | "single";
export type Point = { x: number; y: number };
export type Dot = Point & {
  data?: boolean;
  id: string;
  r: number;
  color: string;
  opacity: number;
  group?: string;
  role?: "record" | "halo";
  tint?: number;
  tintColor?: string;
};
export type Line = {
  id: string;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  highlight?: number;
  group?: string;
  data?: boolean;
};
export type Label = Point & {
  id: string;
  text: string;
  sub?: string;
  color?: string;
  anchor?: "start" | "middle" | "end";
  group?: string;
};
export type Frame = {
  motionPhase?: string;
  layout?: "bars";
  dots: Dot[];
  bridges?: { id: string; points: Point[]; color: string; opacity: number }[];
  lines: Line[];
  labels: Label[];
  title: string;
  value: string;
  unit: string;
  notes: string[];
  legend: string;
  summaryOpacity: number;
  choices: { id: string; label: string }[];
  selection: string[];
  state: State;
};
export type Dish = {
  id: string;
  mealId: string;
  identity: { kind: "menu" | "home"; id: string; name: string } | null;
};
export type ExperienceData = {
  kind: "experienceCluster";
  state: State;
  records: Dish[];
};
export type Sense = {
  id: string;
  name: string;
  color: number;
  mealIds: string[];
  intensity: {
    weak: number;
    medium: number;
    strong: number;
    unanswered: number;
  };
};
export type SensoryData = {
  kind: "sensoryRays";
  state: State;
  domain: "taste" | "aroma" | "texture";
  validMealIds: string[];
  senses: Sense[];
};
export type Evaluation = {
  id: string;
  unitId: string;
  response: number | "split" | "unanswered" | "held";
};
export type PreferenceData = {
  kind: "preferenceFocus";
  state: State;
  mode: Mode;
  responses: Evaluation[];
};
export type Condition = { id: string; label: string; responses: Evaluation[] };
export type ContextData = {
  kind: "contextLayers";
  state: State;
  mode: "liking" | "fit";
  dimension: "intensity" | "food" | "target" | "phase";
  sense: string;
  conditions: Condition[];
};
export type Period = {
  label: string;
  start: string;
  end: string;
  state: State;
  value: number | null;
};
export type ChangeData = {
  kind: "changeRipples";
  state: State;
  metric: string;
  unit: string;
  maximum: number;
  previous: Period;
  recent: Period;
};
export type Data =
  | ExperienceData
  | SensoryData
  | PreferenceData
  | ContextData
  | ChangeData;
export type Options = {
  playback?: Playback;
  selected?: string;
  page?: number;
  alignment?: number;
  rotation?: number;
  /** Optional elapsed idle seconds, retained while the entrance is rewound on scroll. */
  rotationTime?: number;
};
