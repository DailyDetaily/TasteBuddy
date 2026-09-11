# 질문 카드용 Palate Bloom 일러스트

2026-09-08 · 내장 image_gen으로 생성한 PNG 5종. 앱 코드에는 적용하지 않은 제작 원본이다.

| 파일 | 질문 주제 | 조형 의도 |
| --- | --- | --- |
| 01-intensity.png | 느낀 강도 | 중심에서 번지는 겹꽃 |
| 02-liking.png | 개별 감각의 호감 | 대칭으로 마주 보는 꽃잎 |
| 03-target.png | 느낀 부분 | 전체에서 떨어져 나온 한 부분 |
| 04-phase.png | 느낀 시점 | 같은 크기의 꽃 세 개가 이루는 흐름 |
| 05-exploration.png | 다음 식사 탐색 | 아직 펼쳐질 가능성이 있는 봉오리 |

`index.html`에서 원본과 60×60px 크기를 함께 볼 수 있다. `prompts.json`은 실제 사용한 최초 생성 및 배경 수정 프롬프트다.

참조는 현재 `src/components/system/PalateBloomAvatar.tsx`의 sampleProfiles A/B/C를 꽃잎 6개, roundPetal / thinStar / solidCore로 렌더한 `palate-bloom-reference.png`다. 색상은 iOS PalateBloomAvatar의 팔레트와 맞췄다.

현재 `ios/TasteBuddy/Features/Analysis/SensoryAnalysisCards.swift`의 TasteQuestionMedia는 60×60pt이며, 사진이 없으면 내부 48pt 아바타를 표시한다. 이번 원본은 장식용이며 응답 값이나 취향 판정의 근거가 아니다.

최종 파일은 1254×1254px RGB PNG이며 투명 알파가 없다. 최초 생성의 체크무늬 배경은 제외하고, 밝은 회색 배경으로 다시 생성한 파일만 납품한다. 목표 배경은 #F7F7F7이나 생성 이미지 특성상 색면에 미세한 색 편차가 있어 코드 토큰의 완전한 픽셀 일치를 보증하지 않는다. 정확한 벡터 원본이나 다크 모드용 투명 파일은 이번 산출물에 포함하지 않는다.

앱 UI·로직·빌드 설정을 수정하지 않았으므로 앱 빌드는 생략했다.
