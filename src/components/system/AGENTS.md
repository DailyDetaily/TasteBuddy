# System Components Instructions

`src/components/system/`는 Taste Buddy의 app-specific reusable product UI 레이어다.

- 메인 앱 셸에서 보이는 재사용 UI는 이 레이어를 우선 검토한다
- `src/components/ui/` primitive를 그대로 노출하기보다 Taste Buddy 문맥에 맞게 조합하고 감싼다
- 가능하면 `tb-*` 토큰과 기존 shared class를 재사용한다

시각/카피 규칙:

- 방향성은 Quiet Hospitality Intelligence
- Pretendard 체계를 유지하고 제품 UI 텍스트는 `18px`를 넘기지 않는다
- taste color는 의미용으로만 쓰고 장식용으로 남발하지 않는다
- 큰 제목보다 대비, 여백, 그룹핑으로 위계를 만든다

제품 패턴:

- explainable personalization
- confidence visibility
- chef translation
- empty state with momentum

피해야 할 방향:

- decorative chart only UI
- quantified-self dashboard aesthetic
- purple startup gradient 분위기
- ad hoc 스타일로 기존 product language를 깨는 구현
