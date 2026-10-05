// Display order follows ios/TasteBuddy/Resources/TBA/tba-sensory-contract.json.
// Avatar assignments are art direction for this film, not measured user profiles.
export const profileTasteTypes = [
  {
    id: "purist",
    title: "Purist",
    label: "본연형",
    avatarForm: 24,
    reason: "단순한 네 장의 꽃잎과 차분한 토프색",
  },
  {
    id: "maximalist",
    title: "Maximalist",
    label: "강렬형",
    avatarForm: 9,
    reason: "선명한 주황색과 풍성한 여덟 장의 톱니 꽃잎",
  },
  {
    id: "alchemist",
    title: "Alchemist",
    label: "발효형",
    avatarForm: 23,
    reason: "보라색 바탕에 겹쳐지는 꽃잎과 씨앗 암술",
  },
  {
    id: "roaster",
    title: "Roaster",
    label: "고소형",
    avatarForm: 16,
    reason: "구운 곡물을 연상시키는 토프·노랑·주황색",
  },
  {
    id: "romantic",
    title: "Romantic",
    label: "달콤형",
    avatarForm: 15,
    reason: "부드러운 원형 꽃잎과 주황·보라색 조합",
  },
  {
    id: "texturalist",
    title: "Texturalist",
    label: "식감형",
    avatarForm: 32,
    reason: "마름모 꽃잎과 점 수술이 만드는 또렷한 질감",
  },
  {
    id: "epicure",
    title: "Epicure",
    label: "농밀형",
    avatarForm: 2,
    reason: "기존 블루 Rosette의 여러 겹 꽃잎과 밀도 있는 암술",
  },
  {
    id: "refresher",
    title: "Refresher",
    label: "산뜻형",
    avatarForm: 5,
    reason: "라임색 바탕과 가볍게 벌어지는 캡슐 꽃잎",
  },
  {
    id: "harmonist",
    title: "Harmonist",
    label: "조화형",
    avatarForm: 30,
    reason: "규칙적인 여덟 방향 대칭과 균형 잡힌 색상 배치",
  },
] as const;

const loopGap = {
  id: "loop-gap",
  title: "",
  label: "",
  avatarForm: 0,
  reason: "새 루프를 구분하는 빈 행",
};
// An empty row separates Harmonist and Purist, including the first view.
export const profileDisplayRows = [
  { ...loopGap, rowIndex: -1 },
  ...profileTasteTypes.map((profile, rowIndex) => ({ ...profile, rowIndex })),
  { ...loopGap, rowIndex: 9 },
  { ...profileTasteTypes[0], rowIndex: 10 },
  { ...profileTasteTypes[1], rowIndex: 11 },
];
