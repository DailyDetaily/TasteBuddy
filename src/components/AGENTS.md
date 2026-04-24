# Components Instructions

`src/components/`는 shared UI와 feature component 레이어다.

배치 규칙:

- Taste Buddy 제품 언어에 가까운 재사용 UI는 `system/`
- generic primitive는 `ui/`
- 특정 흐름이나 도메인에 묶인 구현은 해당 feature 폴더

작업 규칙:

- 새 컴포넌트를 만들기 전에 기존 shared component를 먼저 재사용한다
- hardcoded one-off 스타일보다 기존 token, shared class, established pattern을 우선 사용한다
- reusable pattern을 바꾸면 design system 문서와 preview 반영이 필요한지 함께 확인한다

하위 폴더 규칙:

- `system/*` 파일은 [`system/AGENTS.md`](./system/AGENTS.md)를 추가로 따른다
- `ui/*` 파일은 [`ui/AGENTS.md`](./ui/AGENTS.md)를 추가로 따른다

공통 제품 가드레일:

- Taste Buddy는 taste-to-chef translation 제품이다
- hardware mandatory framing을 넣지 않는다
- generic restaurant booking app처럼 보이는 패턴으로 drift 하지 않는다
