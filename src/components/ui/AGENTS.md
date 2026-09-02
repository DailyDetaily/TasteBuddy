# UI Primitive Rules

`src/components/ui/`는 low-level primitive 레이어다.

- API는 generic, reusable, accessibility-safe 하게 유지한다.
- Taste Buddy 카피, 예약 로직, chef-facing assumption은 넣지 않는다.
- 제품 의미가 필요하면 `system/`에서 감싸거나 조합한다.
- public prop shape는 단순하게 유지하고 keyboard/focus/disabled/aria behavior를 깨지 않는다.
