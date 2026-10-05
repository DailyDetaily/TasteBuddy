# 그래프 모션

Studio: http://localhost:3110/TasteGraph-Bar

`Graph-Motion` 폴더에 다섯 컴포지션을 등록했다. 모두 1080×1080, 30fps다.

- `TasteGraph-Bar`: 상세 크기 캡슐 막대. 마지막 막대에만 끝점.
- `TasteGraph-Bar-Home`: 홈의 132×32 논리 크기와 최대 12pt 막대 폭을 확대 표시.
- `TasteGraph-Bar-Distribution`: 모든 양수 막대에 끝점을 표시하는 5단계 분포. 수치와 범주 표시.
- `TasteGraph-TasteChange`: 미각 변화 카드의 가로 트랙·그라데이션 선·현재 끝점.
- `TasteGraph-TasteChange-Reference`: 첨부 GIF의 진입 속도와 같은 속도로 우측 끝점에 모여 사라지는 버전.

기준 소스는 `ios/TasteBuddy/Components/SystemParityComponents.swift`의 `TasteChartBarMark`와 `ios/TasteBuddy/Features/Home/HomeArchiveVisualizationViews.swift`의 `HomeArchiveChartView`다. 상세 막대는 최대 폭 16pt, 플롯 높이 180pt를 사용한다. 색상은 `src/constants/designTokens.ts`의 기존 맛 팔레트를 직접 가져온다. 연한 몸체(tintSoftBorder, 주색 18%)와 진한 원형 끝점(main)을 유지한다. 미니 화면에는 기준선이나 범례를 추가하지 않는다.

바닥을 고정하고 왼쪽부터 0.1초 간격으로 1.2초 동안 자란다. 정착 후 3초 유지하고, 오른쪽부터 진입을 역재생해 수축한다. 높이는 실제 예시 값/최댓값에 비례하며 오버슈트하지 않는다. 끝점 지름은 막대 폭과 현재 높이 중 작은 값이므로 작은 값이 부풀려지지 않는다.

Studio의 Inspector → Default Props에서 형태, 맛 색상, 끝점 규칙, 재생 모드, 진입 시간, 막대 간 지연, 유지 시간, 수치/라벨, 배경색, 데이터를 바꿀 수 있다. 저장할 수 있도록 컴포지션 ID와 기본값은 `Root.tsx`에 명시적으로 등록했다. 현재 Studio의 기본값 저장 기능은 Root 파일에서 선언을 찾는다. 타이밍과 데이터 개수에 따라 전체 길이가 다시 계산된다. 각 막대는 시퀀스로 구성하며 Studio는 같은 코드로 반복 생성된 막대를 `+N`으로 묶어 표시한다. `진입 후 유지`는 퇴장을 생략하고 `정지`는 첫 프레임부터 완성된 원본 형태를 보여준다.

데이터는 모션 확인용 합성 횟수이며 실제 계정 기록과 연결되어 있지 않다. 0은 0, null은 미확인이다. 둘 다 막대를 만들지 않고 라벨을 켜면 각각 `0`/`—`로 구분한다. 애니메이션 중 수치를 카운트업하지 않는다. 네이티브 앱 코드는 수정하지 않는다.

검증 프레임 재생성:

```sh
cd brand-launch
node scripts/render-graph-frames.mjs
```

결과는 `brand-launch/output/graph-motion/`에 저장한다. 이 명령은 PNG 프레임만 출력한다.

## 검증 기록

- `npx tsc --noEmit`, `npx eslint src/GraphMotion src/Root.tsx` 통과.
- 36가지 크기·재생 모드·데이터 조합의 36,354개 막대 상태 검사 통과. 바닥 고정, 높이 비율, 오버슈트 없음, 끝점의 막대 내부 배치, 0/null, 역방향 탐색을 확인했다. 결과: `output/graph-motion/geometry-verification.json`.
- 진입·정착·퇴장과 홈/분포/0·미확인·작은 값/정지 모드의 12개 PNG 렌더 완료. `frames.json`과 `motion-contact-sheet.png`에 기록했다.
- 실행 중인 Studio에서 세 컴포지션 등록, 30fps 재생, Inspector의 수치/라벨 변경과 Root 파일 자동 저장을 확인했다. 기존 기본값으로 복구했다. 세 컴포지션 모두 Studio의 기본값 저장 가능 판정을 통과했다. MP4 출력 및 네이티브 앱 검증은 실행하지 않았다.

## 미각 변화 카드의 가로 그래프

Studio: http://localhost:3110/TasteGraph-TasteChange

원본은 `SystemParityComponents.swift`의 `TasteLineChart`와 `TasteChangeEmptySummary`다. 논리 너비 132pt, 행 높이 24pt, 행 간격 4pt, 연한 트랙 12pt, 그라데이션 선 2pt, 현재 점 반경 6pt를 유지한다. 최대 7개 기록과 점 사이 최대 36pt, 짧은 기록의 오른쪽 정렬, 전체 행의 공통 값 범위 및 상하 여유도 네이티브 계산과 같다. 꺾인 경로를 곡선으로 바꾸지 않는다.

왼쪽부터 원래 경로를 따라 선을 드러내며 원형 끝점이 이동한다. 기본 진입은 행당 1.4초, 행 간 지연 0.14초, 유지 3초다. 퇴장은 같은 경로를 되짚는다. 정착 후 값·경로는 움직이지 않는다.

기록 한 개와 `첫 기록 대기선`을 함께 사용하면 현재 점은 왼쪽에 고정되고 장식용 대기선만 오른쪽으로 흐려진다. 빈 배열은 회색 비교 대기 그래프로 표시한다. 숫자 0과 음수는 실제 예시 값이며 빈 데이터로 취급하지 않는다. 이 예시는 실제 계정의 미각 변화 결과가 아니다.

Inspector에서 행별 미각·기록값, 진입 시간·행 간 지연·유지 시간, 재생 방식과 라벨을 조절할 수 있다. 기본값은 다른 그래프와 같이 `Root.tsx`에 등록해 Studio 저장을 지원한다.

`node scripts/render-graph-frames.mjs --line`으로 진입·정착·퇴장·빈 기록·첫 기록·0/짧은 기록의 12개 PNG를 `output/graph-motion/taste-change/`에 렌더한다.

가로 그래프 검증: TypeScript와 변경 파일 ESLint 통과. 30가지 데이터·재생 조합의 7,632개 상태에서 공통 범위, 오른쪽 정렬, 원래 경로와 현재 점의 일치, 대기 점 고정, 0/음수, 프레임 역탐색, 루프 경계를 확인했다. 12개 PNG를 렌더했고 기본·대기·빈 상태를 시각 검토했다. Studio에서 131→142 프레임 진행, 두 행 표시, 약 30fps 재생, 기본값 저장 경고 없음을 확인했다. 기존 막대 그래프의 계산과 기본값은 변경하지 않았다.

## 첨부 GIF를 참고한 버전

Studio: http://localhost:3110/TasteGraph-TasteChange-Reference

`Taste Card Scroll_1.gif`는 3840×2160, 25fps, 75프레임/3초다. 전체 카드와 그래프를 분리해 살폈다. 원본 분석·확대 프레임·끝점 좌표는 `output/graph-motion/reference-scroll/`에 있다. GIF 원본은 수정하지 않는다.

- 약 0.36초에 같은 크기의 끝점 두 개가 주색으로 함께 나타난다. 시간에 따른 투명도 변화는 없다.
- 끝점은 원래 꺾인 선을 따라 이동한다. 초반 가속과 후반 감속을 원본의 정규화된 x 좌표에 맞춘 cubic-bezier(0.3038, 0, 0.2562, 1)로 근사했다. 위치 진행률의 측정값 대비 RMSE는 약 0.009, 최대 차이는 약 0.020이다. 이는 진행 속도 측정이며 전체 영상의 픽셀 일치 결과가 아니다.
- 현재 30fps 버전은 11프레임부터 진입, 42프레임 정착, 67프레임부터 우측 이동, 98프레임에 노드 도착, 99프레임부터 빈 화면, 총 112프레임(약 3.73초)이다. 행 간 지연 기본값은 0이다.
- 몸체 12pt·그라데이션 선 2pt·끝점 반경 6pt를 유지한다. 연한 트랙은 기존 주색 18%의 고정 팔레트이며 농도가 변하지 않는다. 끝점은 처음부터 불투명한 주색이다. 페이드와 회전은 없다.
- 퇴장 때 우측 노드는 고정되고, 트랙과 얇은 선의 왼쪽 끝이 원래 경로를 따라 노드까지 이동한다. 그라데이션의 시작 위치도 함께 이동한다. 진입 끝점과 퇴장 왼쪽 끝은 같은 경과 프레임에서 정확히 같은 위치에 있으며, 이동 시간과 가속·감속 곡선도 같다. 도착 프레임에는 노드만 남고 다음 프레임에 즉시 사라진다.
- `ReferenceTasteChangeGraph`는 공통 `TasteChangeGraphView`를 사용한다. 기존 `TasteGraph-TasteChange`의 진입·되감기 방식과 기본값을 보존했다.

단맛·감칠맛의 끝값 15.2/-10.7은 GIF 표기를 참고했다. 중간 7점 배치는 조형 확인용 합성 값이며 실제 사용자 기록이나 원본의 개별 측정값이 아니다. 첫 기록 대기선은 점을 이동시키지 않는다.

Inspector에서 시작 대기·진입·유지·끝 여백을 조절한다. 퇴장은 진입 시간에 연동되므로 독립 퇴장 시간 항목은 없다. 기록 대기 상태는 실제 노드가 왼쪽에 있으므로 장식용 대기선을 그 실제 노드 방향으로 거둔다. `node scripts/render-graph-frames.mjs --reference`로 현재 모션과 기존 그래프 보존 확인용 프레임을 `output/graph-motion/reference-scroll/rightward-exit/`에 렌더한다.

이전 접힘 버전의 분석과 검증은 `reference-scroll/`의 기존 파일에 보존했다. 수정 전 모션 소스는 `revisions/before-rightward-exit/*.snapshot`에 있다. 현재 버전 검증은 `rightward-exit/`에 별도로 기록한다.

우측 이동 버전 검증: TypeScript·ESLint 통과. 320쌍의 진입/퇴장 위치와 진행률이 일치하고, 1,136개 포즈에서 우측 노드 고정·도착 다음 프레임의 즉시 제거·대기/0/빈 값·정지/유지 모드를 확인했다. 18개 PNG를 렌더해 진입부터 도착/제거까지 시각 검토했다. 기존 가로 그래프 보존, 루프 첫/마지막 프레임 동일, 정지/정착 화면 동일을 픽셀 비교했다.

### 높낮이 확대

두 그래프 사이 간격은 실제 선의 범위를 기준으로 좁혔다. 현재 3배 설정에서 행 시작 간격은 48pt에서 28pt로 줄었으며, 다른 기록값을 넣어도 선끼리 최소 4pt 여유가 남도록 필요한 만큼만 간격을 확보한다.

현재 Reference 버전의 `높낮이 배율` 기본값은 3배다. Inspector에서 1~6배로 조절한다. 예시 기록값과 x 좌표는 그대로 두고, 공통 값 범위로 계산한 세로 변화 폭만 확대한다. 1배는 최초 모양이다. 행 높이를 배율에 맞춰 함께 확보하고, 트랙 12pt·선 2pt·노드 반경 6pt는 유지한다. 3배에서 행 높이는 44pt다.

진입/퇴장 시간·이징, 우측 노드 고정, 도착 후 즉시 사라짐, 고정 농도는 그대로다. 확대된 경로도 진입 끝점과 퇴장 왼쪽 끝이 같은 시간에 같은 위치를 지나도록 계산한다. `node scripts/render-graph-frames.mjs --height`로 현재 모습, 1배/6배, 퇴장과 원본 그래프 확인용 PNG를 `reference-scroll/dynamic-height/`에 렌더한다.

높낮이 검증: TypeScript·ESLint 통과, 1/4/6배의 세로 배율·행 안의 노드/트랙 여백·진입과 퇴장의 위치 일치를 확인했다. 9개 PNG 렌더 완료. 1배 결과는 직전 Reference 정착 화면과, 기본 가로 그래프는 변경 전 화면과 픽셀이 동일했다. 근거는 `dynamic-height/verification.json`, `pixel-verification.json`, `frames.json`에 기록했다.
