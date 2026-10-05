# 맥락 점 크기·등간격 조정

변경: context.ts, scripts/taste-data-category.test.mjs, README.md, 본 문서.

- 선/원호를 모두 제거했다.
- 정착 점 반경 9.5 = 기본 점 링과 동일, 중심 전환 점도 동일 크기.
- 링별 36/45/54/63개 점. 각 링의 이웃한 점 중심 거리 26, 점 가장자리 사이 여백 7.
- 반경은 26 / (2 sin(π/점수))로 계산한다. 색 구역 경계에도 추가 간격을 두지 않는다.
- 대기 시 각 링을 함께 미세 이동시켜 동일 링 내 간격을 유지한다.
- 진입/수축과 조건별 n, 선택 문구는 유지한다. 원호를 없앴으므로 점은 반올림된 비율을 나타내며 정확한 응답 수는 선택 패널에서 확인한다.

실행 위치: brand-launch.
- npx prettier --write src/TasteDataCategoryMotion/context.ts scripts/taste-data-category.test.mjs: 종료 0.
- ./node_modules/.bin/tsc --noEmit: 종료 0.
- ./node_modules/.bin/eslint src/TasteDataCategoryMotion/context.ts: 종료 0.
- node --test --test-name-pattern='context|data marks|idle geometry|all categories' scripts/taste-data-category.test.mjs: 종료 0, 6개 통과.

기본/조밀/단일 조건에서 이웃 점 간격, 크기, 선 없음, 중앙/외곽 여백, 동일 비율 2/3와 20/30, 진입→대기→수축 및 모션 줄이기를 확인했다. 실제 웹에서 선 0개, 반경 9.5, 기본 3층 135개 점을 확인했다.

미리보기: http://localhost:3110/TasteData-all → 맥락.
실제 iOS 기기 및 저장 데이터 연결은 이번 범위 밖이다.

## 지그재그 후속 변경

context.ts의 각 점 반경을 기준 반경 ±6으로 교대하고, 링 점 수를 36/48/60/72로 변경했다. 선 없음, 기본 반경 9.5, 이웃 중심 거리 26, 중앙 여백, 모든 층의 비겹침을 유지한다. 실제 웹 기본 3층은 144개 점이다. 이전 135개 사양을 대체한다.

최종 검사: ./node_modules/.bin/tsc --noEmit 및 context.ts eslint 종료 0. node --test --test-name-pattern='context' scripts/taste-data-category.test.mjs 종료 0, 4개 통과. 중앙 문구 표시 시점을 늦춰 새 안쪽 지그재그 점과의 충돌을 방지했다. 실제 웹 스크린샷 output/playwright/context-zigzag.png에서 조형을 확인했다. 이번 변경은 웹 시각·기하 검증이며 전체 상태 PNG 22개는 재생성하지 않았다.

## 대기 지그재그 반전 후속 변경

context.ts에서 대기 반경 변위를 코사인으로 제어한다. 0/3/6/9/12초의 A/원형/B/원형/A, 고정 점 ID·크기·색, 이음새, 층 간 비겹침, 동일 링 내 등간격을 검증했다. 진입과 수축은 기존 A 패턴을 유지한다. 원형 시에도 최소 점 중심 간격은 지름 19보다 크다.

node --test --test-name-pattern='context|idle geometry|all categories' scripts/taste-data-category.test.mjs: 종료 0, 7개 통과. 변경 파일은 context.ts, 위 테스트 파일 및 문서다.
