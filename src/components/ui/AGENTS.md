# UI Primitives Instructions

`src/components/ui/`는 low-level primitive 레이어다.

- API는 generic, reusable, accessibility-safe 해야 한다
- Taste Buddy 비즈니스 카피, reservation logic, chef-facing domain assumption을 이 레이어에 넣지 않는다
- product-shaped 요구사항이면 여기서 확장하지 말고 `src/components/system/`에서 감싸거나 조합한다

구현 규칙:

- Radix/shadcn-style primitive 책임을 유지한다
- 스타일은 low-level semantic variant 중심으로 유지하고 제품 전용 의미를 섞지 않는다
- public prop shape는 단순하고 예측 가능하게 유지한다
- keyboard, focus, disabled, aria behavior를 깨지 않는다

이 레이어는 브랜드 표현 레이어가 아니라 기반 레이어다.
Taste Buddy 고유의 제품 언어는 상위 `system` 레이어에서 입힌다.
