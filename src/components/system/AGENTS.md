# System Component Rules

`src/components/system/`는 Taste Buddy app-specific reusable UI 레이어다.

- 메인 앱 재사용 UI는 이 레이어를 먼저 검토한다.
- `ui/` primitive를 Taste Buddy 문맥에 맞게 감싸고 `tb-*` 토큰과 shared class를 우선 쓴다.
- Pretendard와 18px 이하 제품 UI 텍스트 원칙을 유지한다.
- taste color는 의미용으로만 쓰고, 위계는 대비/여백/그룹핑으로 만든다.
- explainable personalization, confidence visibility, chef translation, momentum 있는 empty state를 선호한다.
- chart-only, quantified-self dashboard, purple startup gradient, ad hoc 스타일은 피한다.
