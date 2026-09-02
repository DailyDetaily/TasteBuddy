# TasteBuddy — 웹 ChatGPT용 프로젝트 문서

TasteBuddy는 미각 프로필을 해석해 다음 다이닝 경험을 개인화하는 프리미엄 서비스입니다.
이 브랜치는 웹 ChatGPT에서 제품, 디자인, 구조를 검토할 때 읽는 문서 모음입니다.

## 문서 기준

- 저장소: `DailyDetaily/TasteBuddy`
- 문서 브랜치: `docs/chatgpt-context`
- 원본 작업 브랜치: `codex/taste-agent-social-network`
- 원본 기준 커밋: `e7df6ea0cf9476be6c328850935ec3131abb9eb1`
- 캡처 범위: 원본 작업 폴더의 문서 11개. 커밋 이후의 문서 수정도 포함합니다.
- 문서별 원본 경로, 파일 해시, 수정 여부, 캡처 시각: [snapshot.json](./snapshot.json)

이 브랜치에는 앱 소스 코드가 없습니다. 구현 여부를 검증해야 하는 질문에는 코드 확인이 추가로 필요합니다.
원본 작업 브랜치와 커밋은 캡처 출처이며, 원본 코드가 GitHub에 게시되었다는 뜻은 아닙니다.
문서의 계획·가이드·구현 설명을 구분하고, 코드를 직접 확인하지 않은 사항은 미확인으로 표시하세요.
원본 문서에서 이 모음에 포함되지 않은 파일로 향하던 상대 링크는 원본 경로 텍스트로 표시했습니다.

## 먼저 읽을 문서

처음에는 아래 세 문서만 읽고, 질문에 필요한 자료를 추가로 확인하세요.

1. [제품 경험 기준](./context/src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md): 서비스 정체성, 사용자 가치, 경험 원칙.
2. [아키텍처](./context/ARCHITECTURE.md): React 앱, 네이티브 앱, 데이터 파이프라인의 역할.
3. [AI 디자인 시스템 안내](./context/docs/AI_DESIGN_SYSTEM.md): 디자인 판단 기준과 토큰·컴포넌트 사용 방향.

## 질문별 읽기 경로

| 검토 주제 | 읽을 문서 |
| --- | --- |
| 서비스와 사용자 흐름 | [앱 요약](./context/docs/TASTE_BUDDY_APP_SUMMARY.md), [제품 경험 기준](./context/src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md) |
| 시각 디자인·UX | [디자인 시스템](./context/DESIGN.md), [AI 디자인 안내](./context/docs/AI_DESIGN_SYSTEM.md) |
| 구조·개발 방식 | [아키텍처](./context/ARCHITECTURE.md), [기여 가이드](./context/CONTRIBUTING.md), [원본 README](./context/README.md) |
| 취향 해석·TasteBuddyAgent | [에이전트 설계](./context/docs/product/taste-buddy-agent.md) |
| 음식 지식·검색·RAG | [지식/RAG 계획](./context/docs/product/tba-knowledge-rag-plan.md) |
| 네이티브 앱의 범위 | [네이티브 앱 안내](./context/ios/README.md), [아키텍처](./context/ARCHITECTURE.md) |
| Codex에 구현을 전달할 때 | [작업 지침](./context/AGENTS.md), [기여 가이드](./context/CONTRIBUTING.md) |

## 유지할 제품 원칙

- UX는 calm, premium, precise를 유지합니다. 수치 자체보다 해석과 다음 행동을 먼저 보여줍니다.
- 의료 진단, 실험실 장비, 일반 예약 서비스, 가벼운 취향 테스트처럼 보이는 방향은 피합니다.
- 하드웨어는 선택적인 정밀도 보완 수단입니다.
- 셰프의 의도를 존중하는 가이드를 제공합니다.
- UI 제안은 기존 `src/components/system/`과 디자인 토큰 재사용을 먼저 고려합니다.
- `src/` 앱 UI, `ios/` 네이티브 앱, `scripts/`·`docs/content/`·`supabase/` 데이터 작업을 구분합니다.

세부 제품·디자인 규칙은 해당 주제의 원본 문서가 기준입니다. 문서 간 충돌이 있으면 파일과 항목을 함께 제시하세요.

## 웹 ChatGPT에 전달할 요청 예시

> GitHub의 DailyDetaily/TasteBuddy 저장소에서 docs/chatgpt-context 브랜치의 README.md를 읽고, 안내된 제품 경험 기준·아키텍처·AI 디자인 문서를 확인해 줘. 이 브랜치는 문서 스냅샷이므로 실제 코드까지 확인한 것으로 간주하지 마. 실제로 읽은 파일을 출처와 함께 표시하고, TasteBuddy의 제품 정의·핵심 사용자 흐름·구조·디자인 제약을 요약해 줘. 이후 내가 주는 설계 질문을 이 기준으로 검토해 줘.

GitHub 연결이 없는 경우에도 웹 검색을 사용할 수 있는 대화에서 다음 공개 링크를 열도록 요청할 수 있습니다.

- [문서 진입점](https://github.com/DailyDetaily/TasteBuddy/blob/docs/chatgpt-context/README.md)
- [진입점 원문](https://raw.githubusercontent.com/DailyDetaily/TasteBuddy/refs/heads/docs/chatgpt-context/README.md)

## Codex로 돌려줄 검토 결과

검토 질문 하나마다 다음 내용을 남기세요.

1. 질문과 검토한 문서 버전.
2. 추천안과 선택 근거.
3. 다른 대안과 장단점.
4. 근거 문서의 파일 경로와 해당 절.
5. 가정, 불확실한 부분, 추가로 확인할 코드.
6. 구현 시 제약과 검증 방법.

결과를 GitHub Issue 댓글이나 Codex 대화에 전달하면, Codex가 현재 코드와 대조해 구현할 수 있습니다.

## 갱신 방식

이 문서 모음은 캡처 시점의 스냅샷입니다. 로컬 파일 수정만으로 갱신되지 않습니다.
원본 문서가 바뀌면 문서 모음과 `snapshot.json`을 함께 갱신하고 이 브랜치에 새 커밋을 게시하세요.
특정 검토를 재현해야 할 때는 이 브랜치의 문서 커밋 URL을 함께 기록하세요.
