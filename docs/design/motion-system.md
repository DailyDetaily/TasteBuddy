# 플레이팅 모션 시스템 · Plating Motion

**플레이팅(Plating)**은 Taste Buddy의 디자인 시스템이고, **Plating Motion**은 그 안의 움직임 규칙이다. 입력에 응답하고, 정보의 관계를 정돈하고, 의미가 드러나는 순간을 강조한다. 기본 값 → 동작 역할 → 키프레임 → 연출 패턴의 네 층으로 관리한다.

## 기준과 네이밍

| 층 | 정의 | 기준 파일 |
| --- | --- | --- |
| 기본 값 | 시간·간격·이동량·스케일·이징 | `src/constants/designTokens.ts`의 `MOTION_TOKENS` |
| 동작 역할 | `press`, `feedback`, `content`, `sheet`, `bloom` | `src/constants/platingMotion.ts`의 `PLATING_MOTION_ROLES` |
| 키프레임 | 시작·중간·종료 상태와 각 구간의 보간 | 같은 파일의 `PLATING_MOTION_RECIPES` |
| 연출 패턴 | 블룸 프레임·소스 스플래터 및 아래 카탈로그 | 각 Remotion 원본과 이 문서의 계약 |

웹 키프레임과 CSS 클래스는 `plating-{대상}-{동작}`으로 명명한다. 예: `plating-content-enter`, `plating-sheet-exit`, `plating-result-bloom`. 코드에서 고르는 이름은 `contentEnter`, `sheetExit`, `resultBloom`이다. 기존 `--tb-*`, `TBMotion`, `TasteBloomMotion` 및 컴포지션 ID는 유지한다. iOS의 `PlatingMotion`은 기존 타입의 별칭이다.

### 곡선과 시간

- **웹 기본**: 상태 변경 `ease`, 등장 `cubic-bezier(0.22, 1, 0.36, 1)`, 퇴장 `ease-out`. 키프레임 구간마다 적용한다.
- **iOS 기본**: 네이티브 `Spring(duration:bounce:)`, bounce `0.18`. 역할의 체감 시간과 `settlingDuration`을 구분한다. 고정 CSS 곡선으로 대체하지 않는다.
- **결과 카드 블룸**: 기존 웹의 `860ms + 120ms 지연`, `cubic-bezier(0.18, 0.92, 0.2, 1)`을 보존한다. `bloom` 역할의 720ms와 별도다.
- **브랜드 연출**: 블룸 프레임은 구간별 `smoothstep(t) = t²(3−2t)`, 소스 스플래터는 ω=14, ζ=0.58인 기존 감쇠 스프링을 쓴다. 하나의 기본 이징으로 합치지 않는다.
- **순차 등장**: 기본 간격 60ms. 신규 웹 프리셋의 추가 지연은 최대 240ms로 제한한다. 이는 새 웹 기본값이며 기존 iOS 대기 카드나 Remotion 타임라인의 간격을 변경하지 않는다.
- **시계**: 웹은 ms, iOS·Remotion 원본은 s. 영상의 프레임은 `round(seconds × fps)`로 마지막에 환산한다. 30fps의 60ms는 정확한 정수 프레임이 아니므로 프레임 수를 원본 시간 대신 저장하지 않는다.

### 오버슛 강도

2026-10-10 기본 확정, 2026-10-11 파이·트리맵 0% 개별 기준 갱신. 플레이팅의 텐션은 **봉우리 한 번과 부드러운 안착**을 기준으로 한다. 파이·버블 비교에서 8%는 강하고 2%는 약하다는 피드백을 반영해, **브랜드 그래픽·미니 차트 연출의 오버슛을 4%로 채택**한다. 일반 UI의 미세한 안착과 제품 데이터 표시부는 아래 별도 기준을 유지한다. 적용 범위를 구분하며 기존 개별 시퀀스를 일괄 변경하지 않는다.

| 용도 | 기준 오버슛 | 최종 크기가 1일 때의 봉우리 | 적용 규칙 |
| --- | ---: | ---: | --- |
| 텍스트·일반 콘텐츠·시트 | **0%** | `1.000` | 가속·감속, 이동 거리와 등장 간격으로 리듬을 만든다. |
| 작은 비정량 UI의 미세한 안착 | **1%** | `1.010` | 선택 표시·장식 아이콘 등에서 필요한 경우에만 사용한다. 일반 요소에 일괄 적용하지 않는다. |
| 결과 카드·헤더의 작은 Bloom | **1.8%** | `1.018` | 기존 결과 카드와 네이티브 헤더 봉우리를 유지한다. |
| 일반 UI의 상한 | **2%** | `1.020` | 작은 컨트롤·카드의 미세한 반응에 적용한다. 아래 브랜드 그래픽 강도와 구분한다. |
| 브랜드 그래픽·미니 차트 연출 | **4%** | `1.040` | 강조가 필요한 버블 등에 적용한다. 아래 별도 기준에 따라 파이·트리맵은 0%다. 진입에서 한 번만 넘었다가 정확히 100%로 안착한다. 최종 형태·값·배치는 유지한다. |
| 실제 제품의 데이터 차트·숫자·카운트·진행률 | **0%** | 최종 데이터 기하에서 정지 | 값을 인코딩하는 길이·반지름·면적·각도와 숫자는 최종값을 넘지 않는다. 순차 공개와 끝의 감속으로 텐션을 만든다. |
| 일반 퇴장·동작 줄이기 | **0%** | 새 봉우리 없음 | 퇴장은 추가 팽창 없이 정리한다. 동작 줄이기는 같은 최종 상태를 즉시 보여 준다. |

**퍼센트의 기준**

- 스케일·반지름 오버슛은 `(봉우리 / 최종값 − 1) × 100`이다. 최종 스케일이 1일 때 `1.018`은 1.8%, 채택값 `1.04`는 4%, 이전 실험값 `1.08`은 8%다. 시작 크기와 최종 크기의 차이를 뜻하지 않는다.
- 원의 반지름이 4% 커지면 면적은 **8.16%**, 8% 커지면 **16.64%** 커진다. 4%는 면적이 아니라 스케일·반지름 기준이다. 브랜드 모션의 중간 연출과 실제 제품의 값 표시를 구분한다. 제품 데이터 표현부의 기본은 0%이며, 브랜드 연출을 제품에 자동으로 옮기지 않는다.
- `Spring.bounce = 0.18`은 **18% 오버슛이 아니다.** 네이티브 문서의 약 1.1%는 정지 상태에서 시작한 정규화 스프링 응답의 초과량이다. 실제 크기의 초과량은 시작/목표 상태와 초기 속도에 따라 달라지므로 `scale(1.011)`로 기계적으로 치환하지 않는다. 위치 모션은 px/pt와 이동 거리 기준을 함께 기록한다.
- `press`의 `0.98`, 탭의 선택 목표 `1.1`, 반복 그래픽의 pulse 폭 등은 눌림·선택 상태·연속 연출의 값이다. 목표를 잠깐 넘었다가 돌아오는 오버슛과 구분한다.

**제작·검토 규칙**

- 원형·텍스트·아이콘의 최종 형태와 기준점을 보존한다. 확대되는 가장자리의 잘림과 인접 요소 겹침을 확인하고, 문제가 있으면 간격이나 원본 크기를 바꾸기 전에 봉우리부터 줄인다.
- 눈에 띄는 반복 튕김은 만들지 않는다. 기존 `resultBloom`의 `1.018 → 0.996 → 1`처럼 문서화된 작은 복귀는 유지할 수 있다. 오버슛을 낮춘 대신 속도·지연·반복 횟수를 동시에 늘리지 않는다.
- 소스 스플래터 등 독립 브랜드 패턴의 형태 변형은 해당 원본 계약으로 관리한다. 큰 변형을 일반 UI나 데이터 차트로 옮기는 근거로 삼지 않는다. 새 독립 연출은 목적·변형 축·봉우리·안착·사용 범위를 별도로 기록한다.
- 브랜드 그래픽·미니 차트의 강조는 **4%를 기본이자 상한**으로 사용한다. 8%는 채택하지 않는다. 이 범위를 넘는 새 연출은 실험값으로 구분하고 목적·범위·검토 결과를 기록한다.

**버블의 채택 키프레임과 파이·트리맵 예외**

- 버블의 원본 스케일 기준 `0 → 1.04 → 1.00`. 30프레임 진입의 65% 지점에 봉우리를 두고, 나머지 구간에서 부드럽게 안착한다. 두 구간 모두 cubic ease-in-out을 사용한다.
- 조각당 0.5초, 기본 시차 0.1초, 전체 60fps·300프레임을 유지한다. 버블은 항목 수가 늘면 총 지연 폭을 12프레임 안으로 조정한다. 파이·트리맵은 아래 별도 기준을 사용한다.
- 파이는 시계 방향으로 채우고 반시계 방향 역순으로 비운다. 버블·트리맵은 왼쪽부터 등장하고 오른쪽부터 사라진다. 트리맵은 셀의 중심 x 좌표, 같은 x에서는 중심 y 좌표 순서로 진행한다. 퇴장에는 별도 오버슛을 추가하지 않는다.
- **트리맵은 오버슛 0%**: 2026-10-11 피드백에 따라 `0 → 1.00`으로 연속 성장한다. 셀당 42프레임(0.7초), 기본 시차 6프레임·총 지연 폭 최대 30프레임이다. 진입 18~90프레임, 퇴장 210~282프레임에 smootherstep(`6t⁵ − 15t⁴ + 10t³`)을 사용해 양 끝의 속도·가속도를 0으로 만든다. 300프레임과 원본 형태를 유지한다. 버블의 4%는 유지한다.
- **파이는 오버슛 0%**: 2026-10-11 최종 피드백을 반영한다. 트리맵과 같은 smootherstep, 조각당 42프레임(0.7초)을 유지한다. 전체 진입 구간에 걸쳐 반지름 `0 → 92`로 부드럽게 채우고 원본 크기에서 멈춘다. 진입·퇴장 모두 오버슛을 사용하지 않는다. 시차 6프레임·총 지연 폭 최대 12프레임, 진입 18~72프레임·퇴장 228~282프레임이다. 중심·경계·라운드와 시계 방향 채움·반시계 방향 비움을 유지한다.
- 모션 중에도 원본 값·구성비 계산은 바꾸지 않는다. 최종 스케일은 정확히 1이며, 회색 바탕·장식·추가 반복 없이 기존 형태로 정착한다.

**현재 구현과 적용 상태**

| 대상 | 현재 원본 | 이 기준과의 관계 |
| --- | --- | --- |
| 웹 결과 카드·iOS 헤더 Bloom | `1.018` 봉우리 | 작은 Bloom의 기존 1.8% 기준 유지. |
| iOS 공통 스프링 | `bounce: 0.18`, 정규화 응답 약 1.1% | 플랫폼 모델을 유지한다. 이 표의 스케일 퍼센트로 직접 대체하지 않는다. |
| Remotion `TasteGraph-Bubble` | `BUBBLE_OVERSHOOT = 0.04` | **4% 채택·적용 완료.** 브랜드 그래픽·미니 차트 연출의 기준이다. 300프레임, 원본 최종 형태와 순서를 유지한다. 제품 웹/iOS 적용 완료를 뜻하지 않는다. |
| Remotion `TasteGraph-Pie` | 반지름 `0 → 92`, smootherstep | **오버슛 0%로 확정.** 조각당 0.7초로 채움·비움. 원본 형태·방향·300프레임 유지. |
| Remotion `TasteGraph-Treemap` | 스케일 `0 → 1.00`, smootherstep | **오버슛 0%로 수정.** 셀당 0.7초로 부드럽게 성장·수축하며 원본 형태와 300프레임을 유지한다. |

## 키프레임 계약

각 프리셋은 `id`, 역할, 시작 조건, 적용 범위, `durationMs`, `delayMs`, 이징, 기준점, `frames`를 가진다. 각 프레임은 `offset`(0–1), 상태 이름과 속성 값을 가진다. 0%와 100%를 명시하고, 중간에 빠진 속성은 앞뒤 키프레임 사이에서 보간한다. 기준점은 별도 래퍼에 적용해 컴포넌트의 레이아웃 transform과 충돌하지 않게 한다.

| 프리셋 | 시간 / 지연 | 시작 → 종료 |
| --- | --- | --- |
| `pressIn` / `pressOut` | 각각 120 / 0ms | scale 1 ↔ 0.98; 누름과 해제는 각각의 이벤트 |
| `feedback` | 180 / 0ms | opacity 0 → 1, scale 0.9 → 1; 선택 표시·상태 없는 아이콘 |
| `contentEnter` | 300 / 0ms | opacity 0 → 1, y 8px → 0 |
| `contentExit` | 300 / 0ms | opacity 1 → 0, y 0 → −8px |
| `questionEnter` | 500 / 0ms | opacity 0 → 1, y −20px → 0, scale 0.97 → 1; 위쪽 기준 |
| `sheetEnter` / `sheetExit` | 각각 500 / 0ms | 시트 자신의 높이 100% ↔ 0; 아래쪽 기준 |
| `chartReveal` | 500 / 0ms | 왼쪽에서 표시 마스크 열기; 최종 수치·좌표 고정 |
| `resultBloom` | 860 / 120ms | 아래의 기존 웹 결과 카드 4개 키프레임 |

### 결과 카드 블룸의 실제 키프레임

| 구간 | 지연 포함 시각 | 상태 | opacity | y | scale | blur |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| 0% | 120ms | 응축 | 0 | 24px | 0.88 | 8px |
| 46% | 515.6ms | 봉우리 | 1 | −4px | 1.018 | 0 |
| 72% | 739.2ms | 복귀 | 앞뒤 보간 | 1px | 0.996 | 앞뒤 보간 |
| 100% | 980ms | 안착 | 1 | 0 | 1 | 0 |

이 프리셋은 기존 `.dining-result-card-bloom`에 연결되어 있다. CSS와 Web Animations 프리뷰는 같은 원본에서 생성된다. 기존 halo 연출은 별도 레이어로 보존한다. 나머지 웹 프리셋은 iOS의 상태·거리 규칙을 웹용으로 정의한 공통 라이브러리이며, 모든 제품 화면의 이식이 완료되었다는 뜻은 아니다.

### 인터럽트·접근성·데이터

- 실행 횟수는 기본 1회, 종료는 최종 상태 유지(`fill: both`). 누름 유지시간·토스트 읽기시간·서버 대기시간을 모션 duration에 섞지 않는다.
- 사용자의 다음 입력을 기다리게 하지 않는다. 상태 전환 시 이전 Animation을 취소하고, 제스처가 있으면 해당 플랫폼의 연속 상태/속도를 사용한다. 정적 진입 프리셋을 제스처 엔진으로 사용하지 않는다.
- 동작 줄이기는 지연과 이동·확대·블러를 생략하고 같은 최종 상태를 즉시 표시한다. 루프도 중지한다. 숨겨진 탭·프리뷰는 재생을 멈추고 unmount 시 animation과 프레임 콜백을 정리한다.
- opacity·마스크는 유효 범위를 유지한다. 차트는 최종 데이터 위에 마스크만 적용하며 데이터 값에 오버슈트를 주지 않는다. 의미 없는 0을 양수처럼 만들지 않는다.
- 퇴장 완료 후 DOM 제거·포커스 복귀·`inert` 처리는 시트/컨트롤의 책임이다. opacity 0인 상태만으로 상호작용이 제거되었다고 가정하지 않는다.

## 사용과 프리뷰

웹 원본을 바꾸면 `npm run design:motion`으로 `src/styles/plating-motion.css`를 생성한다. 생성 파일은 직접 수정하지 않는다. `npm run test:motion`은 CSS 동기화, 종료 상태·동작 줄이기, 플랫폼 역할 및 시퀀스 주요 시점을 검사한다.

```tsx
// CSS: 한 번의 정적 진입. 반복 실행은 클래스/요소 생명주기를 관리한다.
<div className="plating-content-enter">...</div>

// Web Animations: 시스템 접근성 값을 전달하고 이전 실행과 unmount를 정리한다.
const { keyframes, options, origin } = getPlatingMotion('questionEnter', {
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  index: 1,
});
element.style.transformOrigin = origin;
const animation = element.animate(keyframes, options);
// 해당 상태를 떠나거나 컴포넌트를 제거할 때 animation.cancel();
```

접근성 설정 변경도 반영해야 하는 지속 컴포넌트는 `matchMedia`의 change를 구독한다. 실제 예시는 `PlatingMotionSection.tsx`다. CSS 클래스는 media query 변경을 자동으로 반영한다. CSS 클래스와 Web Animations를 같은 래퍼에 중복 적용하지 않는다.

```swift
// 기존 tasteBloomMotion modifier와 동일한 네이티브 구현.
withAnimation(PlatingMotion.animation(.content, reduceMotion: reduceMotion)) {
    isExpanded.toggle()
}
```

`/design-system#motion`에서 10개 웹 프리셋을 재생·일시정지·탐색하고, 0.25×/0.5×/1× 속도와 30/60fps 환산, 시스템 또는 수동 동작 줄이기를 확인한다. 브랜드 패턴의 시점 표는 원본 코드의 랜드마크이며 웹 기본 샘플이 해당 브랜드 연출을 렌더링하는 것은 아니다.

## 기존 모션 카탈로그

정리 기준: 2026-09-30의 현재 소스와 Remotion 등록 목록. 이름, 동작, 사용처를 찾기 위한 카탈로그다. 화면 비율·해상도·예시 데이터·정지 상태만 다른 컴포지션은 같은 모션의 변형으로 묶는다. 이번 정리는 소스 확인이며 전체 영상의 재검수나 네이티브 적용 완료를 뜻하지 않는다.

## 시스템의 구성

- **기본 동작 역할**: 누름, 선택 피드백, 콘텐츠 전환, 시트, 블룸. iOS의 시간·스프링 원본은 [TasteBloomMotion.swift](../../ios/TasteBuddy/DesignSystem/TasteBloomMotion.swift), 적용 규칙은 [TasteBloomMotion](taste-bloom-motion.md)에서 관리한다.
- **이름 있는 표현 패턴**: 블룸 프레임, 소스 스플래터처럼 형태와 순서가 정해진 모션. 아래에 확정 이름과 현재 구현 범위를 기록한다.
- **브랜드·데이터 시각화**: 로고, 아바타, 분석 그래픽, 카테고리 등의 독립 시퀀스. 각 소스 폴더가 타임라인과 데이터 의미의 기준이다.

웹 일반 UI의 CSS 시간·이징은 [DESIGN.md](../../DESIGN.md)의 Motion Tokens를 따른다. iOS 기본 스프링, 웹 토큰, Remotion의 개별 연출 곡선은 서로 다른 구현이므로 하나의 시간값으로 간주하지 않는다.

| iOS 기본 역할 | 체감 시간 | 용도 |
| --- | ---: | --- |
| `press` | 120ms | 버튼 누름과 복귀 |
| `feedback` | 180ms | 선택, 칩, 탭, 짧은 피드백 |
| `content` | 300ms | 카드 정리, 단계·기간 교체 |
| `sheet` | 500ms | 시트, 질문 펼침, 그래프 등장, 지도 초점 |
| `bloom` | 720ms | 기록 진입, 결과 카드, 심벌 강조 |

위 시간은 네이티브 스프링의 체감 시간이다. 실제 안착 시간 및 아래 시퀀스의 전체 길이와 다르다.

## 소스 스플래터 · Sauce Splatter

- **시스템 식별자**: `sauce-splatter`
- **확정 이름**: 소스 스플래터 / Sauce Splatter. 앞서 논의한 Sauce Spread, Sauce Drizzle은 사용하지 않는다.
- **용도**: 결과 카드의 맛 반응 칩과 상세 태그가 서로 이어지며 등장하는 패턴.
- **현재 적용**: Remotion `TabBar-CameraEntry-Portrait`의 오른쪽 결과 카드와 독립 컴포지션 `Chip-Motion → Sauce-Splatter`. [독립 Studio 화면](http://localhost:3110/Sauce-Splatter)은 네이티브 음식 종류 칩 규격의 24개 칩을 5줄로 배치하며 문구·아이콘·선택 상태·행 구성·속도·대기·유지·확대 배율·상하 여백·카메라 여백을 조절한다. 기본 상하 여백은 72px이고, 첫 칩 왼쪽에 80px를 두고 우측으로 등장하는 칩을 카메라가 따라간다. 네이티브 앱으로의 모션 이식은 아직 이 패턴의 적용 범위에 포함하지 않는다.

### 동작과 필수 규칙

독립 Studio 예시는 네이티브 음식 종류 칩의 중립색을 사용한다. 카메라는 세 번째 줄의 첫 칩이 캡슐로 확장될 때까지 고정한 뒤 하나의 smootherstep 곡선으로 최종 위치까지 이동한다. 칩 크기는 고정하고 줌아웃하지 않는다. 중간 정지나 끝부분의 추가 이동 없이 카메라가 먼저 정지하고 0.35초 뒤에 마지막 칩이 완성된다(속도 1 기준).

1. 작은 원이 나타나고, 실제 라벨 너비에 맞는 캡슐로 가로 확장한다.
2. 가로 오버슛 순간 높이를 기본의 86%까지 살짝 눌러 탱글한 탄성을 만든다.
3. 앞 칩의 오버슛 정점 전에 오른쪽 가장자리에서 다음 칩의 원이 돋아난다.
4. 두 형태 사이의 메타볼 연결부가 가늘어지며 떨어진 뒤 다음 원이 캡슐로 확장한다.
5. 텍스트의 비율은 유지하고, 정착 후 원래 칩의 크기·색·테두리로 돌아온다.

칩 몸체와 연결부는 하나의 실루엣으로 합성한다. 연결부에 겹친 테두리나 진한 색 이음새를 만들지 않는다. 기본 칩 선택 반응과 구분되는 **등장 연출**이며, 다른 선택 칩 전체에 자동 적용하지 않는다.

독립 `Sauce-Splatter` 화면은 소스가 뿌려지는 느낌을 위해 다음 원의 이탈을 180→120ms, 연결부의 수축·해제를 120→55ms로 줄인다. 연결부 수축은 다음 원 등장 160ms 뒤에 시작한다. 칩 확장·오버슛·안착과 카메라 타이밍은 기존 값을 유지하며, 다른 식사 피드백 화면에는 이 분리 옵션을 적용하지 않는다.

### 현재 타이밍

한 줄의 시작을 0초로 계산한다.

| 시점 | 상태 |
| --- | --- |
| 0.00s | 첫 원 등장 |
| 0.12s | 첫 원이 캡슐로 확장 시작 |
| 0.28s | 두 번째 원이 앞 칩에서 돋아남 |
| 약 0.40s | 첫 칩의 가로 오버슛·높이 압축 정점 |
| 0.50s | 두 번째 원의 연결 해제 완료, 캡슐 확장 시작 |
| 1.30s | 두 칩의 연속 등장 완료 |

기본 3화면 영상에서는 두 선택이 모인 뒤 줄 단위로 시작한다. 맛 반응은 약 23.183초, 상세 태그는 약 32.633초다. 이 시각은 영상 앞부분의 길이를 바꾸면 함께 달라진다. 세 번째 이후의 시작은 `chipStart(index)`가 정하며, 두 번째 이후 0.38초 간격이다.

구현 이름은 기법을 설명하는 `MetaballChipRow`를 유지한다. 디자인 이름과 코드 이름은 아래처럼 연결한다.

- 렌더러: [MetaballChipRow.tsx](../../brand-launch/src/DiningFeedbackMotion/MetaballChipRow.tsx)
- 타이밍·형태·연결부: [chip-motion.ts](../../brand-launch/src/DiningFeedbackMotion/chip-motion.ts)
- 완성 칩: [ResultChip.tsx](../../brand-launch/src/DiningFeedbackMotion/ResultChip.tsx)
- 독립 Studio 화면: [SauceSplatter](../../brand-launch/src/SauceSplatter/README.md). 기존 렌더러와 동작을 재사용하는 모션 예시이며 실제 계정 데이터와 연결하지 않는다.
- 사용처: [Card.tsx](../../brand-launch/src/DiningFeedbackMotion/Card.tsx), [FeedbackFlow.tsx](../../brand-launch/src/TabBarCameraEntry/FeedbackFlow.tsx)
- 기존 검증 코드: [chip-metaball.test.mjs](../../brand-launch/scripts/chip-metaball.test.mjs)

`FeedbackCard`에 `chipEntrance={{ reactions: secondsSinceTasteRowReady, details: secondsSinceDetailRowReady }}`를 전달한다. 각 값은 해당 줄이 준비된 뒤의 경과 초이며, 준비 전에는 음수다. 속성을 생략하면 정적인 칩을 표시한다.

## 블룸 프레임 · Bloom Frame

- **시스템 식별자**: `bloom-frame`
- **용도**: 흰 심벌에서 사진을 담는 결과 카드로 이어지는 등장 패턴.
- **현재 적용**: Remotion `TabBar-CameraEntry-Portrait`의 오른쪽 결과 카드.
- **순서**: 흰 여섯 꽃잎 → 속이 빈 O → 둥근 카드 외곽 → 사진 영역으로 커지는 안쪽 빈 공간 → 블러가 풀리는 사진.

원본 심벌 경로를 유지하고, 꽃잎이 합쳐질 때 모서리는 둥글게 이어진다. 카드는 중앙에서 정면을 유지한 채 확장한다. 메뉴 이름은 첫 제목으로 바로 표시한다.

현재 꽃잎 합체는 0.38–0.60초, 카드 외곽 확장은 0.64–0.94초다. 내부 빈 공간은 외곽보다 0.06초 뒤인 0.70–1.00초에 사진 프레임으로 확장한다. 사진 전체는 1.02초에 나타나고 0.34초 동안 블러 14→0으로 선명해진다. 전체 진입 길이는 1.66초다.

소스: [ResultCardReveal.tsx](../../brand-launch/src/TabBarCameraEntry/ResultCardReveal.tsx), [result-card-geometry.ts](../../brand-launch/src/TabBarCameraEntry/result-card-geometry.ts), [result-card-motion.ts](../../brand-launch/src/TabBarCameraEntry/result-card-motion.ts).

## 현재 구현된 모션 목록

소스에서 확인한 모션을 아래 13개 묶음으로 정리했다. 블룸 프레임과 소스 스플래터 외 항목은 기존 이름 또는 동작 설명이며, 이번에 새 브랜드 이름을 확정한 것은 아니다.

| 묶음 | 종류와 움직임 | 현재 소스 / 대표 Studio ID |
| --- | --- | --- |
| **블룸 프레임** | 심벌 합체 → O 확장 → 카드·사진 프레임 → 블러 해제 | [TabBarCameraEntry](../../brand-launch/src/TabBarCameraEntry/README.md) · `TabBar-CameraEntry-Portrait` 안에 포함 |
| **소스 스플래터** | 원 → 캡슐, 납작한 오버슛, 다음 원의 메타볼 분리 | [Sauce-Splatter 독립 화면](../../brand-launch/src/SauceSplatter/README.md) · [DiningFeedbackMotion](../../brand-launch/src/DiningFeedbackMotion/README.md)의 3화면 영상에도 포함 |
| **기록 버튼·카메라 진입** | 버튼 내부 컬러 흐름·눌림, 버튼 중심 블룸 확장, 카메라 초점 전환 | [TabBarPlusButton](../../brand-launch/src/TabBarPlusButton/README.md), [TabBarCameraEntry](../../brand-launch/src/TabBarCameraEntry/README.md) · `TabBar-PlusButton`, `TabBar-CameraEntry-Portrait` |
| **카드 전환** | 좌우 Y축 플립, 가로 캐러셀, 인사이트 카드 순차 펼침·접힘 | [DiningFeedbackMotion](../../brand-launch/src/DiningFeedbackMotion/README.md), [HomePeriodInsightMotion](../../brand-launch/src/HomePeriodInsightMotion/README.md) · `DiningFeedback-Flip`, `DiningFeedback-Result`, `DiningFeedback-Card`, `HomePeriodInsightCard` |
| **결과 배경** | 세 컬러 덩어리의 유동 그라데이션, 활성 카드·선택 맛에 따른 팔레트 전환 | [Background.tsx](../../brand-launch/src/DiningFeedbackMotion/Background.tsx) · `DiningFeedback-Gradient` 및 결과 카드 영상 |
| **그래프** | 132×56 미니 막대의 성장·유지·역순 수축, 전체 좌표에서 꺾임 R12를 확정한 고정 라인 경로를 따르는 현재 점과 선의 진입·유지·되감기, 왼쪽 면 높이의 R6 직사각형에서 상단 꼭짓점이 왼쪽부터 하나씩 올라가는 미니 영역 성장·역순 수축. 누적 캡슐의 아래 범주→위 범주 순차 성장·유지·역순 수축(그룹 안에서는 좌측부터, 각 층은 직전 누적 높이에서 이어짐). 이전/현재 그룹 막대는 쌍별 동시 성장·유지·역순 수축. 히트맵은 뉴트럴+최저 미각색으로 고정 시드의 랜덤 순서 등장 후 공통 1→2→3→4단계 진행(각 칸은 목표에서 정지)·유지·등장과 다른 고정 시드의 랜덤 순서 퇴장. 날짜별 좌표·값·색 단계와 전체 시간은 유지. 파이는 화면 중앙에서 회색 바탕 없이 양옆 경계·안쪽 끝을 유지한 채 바깥 반지름만 늘리며 오버슛 없는 시계 방향 시차 채움·유지·반시계 방향 역순 비움(조각당 42프레임·기본 간격 6프레임·smootherstep)으로 움직이며 라운드와 완성 원본 경로·구성비를 유지. 버블은 완성된 원 묶음을 화면 중앙에 배치하고 원본 면적 비율·원 사이 간격·숫자/아이콘을 유지하며 왼쪽부터 104% 오버슛 후 안착·유지·오른쪽부터 수축. 트리맵은 원본 둥근 셀·면적 구성비·중심을 유지하며 오버슛 없이 왼쪽부터 부드럽게 성장·유지·오른쪽부터 수축(smootherstep·셀당 42프레임). 아홉 기본 컴포지션은 60fps·300프레임 | [GraphMotion](../../brand-launch/src/GraphMotion/README.md) · `TasteGraph-Bar`, `TasteGraph-Line`, `TasteGraph-Area`, `TasteGraph-StackedBar`, `TasteGraph-GroupedBar`, `TasteGraph-Heatmap`, `TasteGraph-Pie`, `TasteGraph-Bubble`, `TasteGraph-Treemap` |
| **꽃잎·로고** | 꽃잎 3D 펼침·회전·역접힘, 작도 그리드 전개, 워드마크 획 끝부터 채움 | [PetalLogo](../../brand-launch/src/PetalLogo/README.md), [LogoGrid](../../brand-launch/src/LogoGrid/README.md) · `TasteBuddy-Petal-Shorts`, `LogoGrid`, `Logo-Black` 및 HD·비교 버전 |
| **키네틱 타이포** | Kalice 획 채움, 문구 유지와 교체 | [KineticStatements](../../brand-launch/src/KineticStatements/README.md) · `Kinetic-Statements` 및 Square·Portrait |
| **Taste Bloom 아바타** | 꽃 펼침·접힘, 중심에서 바깥으로 파동, 프로필 유형 전환, 값·형태 조절 시연 | [TasteBloomAvatars](../../brand-launch/src/TasteBloomAvatars/README.md), [Workbench](../../brand-launch/src/TasteBloomWorkbench/README.md) · `TasteBloom-9`, `TasteBloom-Wave`, `TasteBloom-Profile`, `TasteBloom-Profile-Landscape`, `TasteBloom-Controls-Demo` |
| **Taste Motion** | 분석, 디테일 매트릭스, 회전 레이어, 피드백 링, 인사이트 링의 5스타일과 연결 시퀀스 | [TasteMotion.tsx](../../brand-launch/src/TasteMotion.tsx), [설명](../../brand-launch/README.md) · `Onboarding-analysis`, `Onboarding-detailMatrix`, `TasteMotion-rotatingLayers`, `TasteMotion-feedbackRings`, `TasteMotion-insightRing`, `TasteMotion-analysisToRotation`, `TasteMotion-completeFlow` |
| **카테고리 시각화** | 경험·감각·취향·맥락·변화의 5종, 점의 해체·교차 이동·재조립 전환 | [TasteDataCategoryMotion](../../brand-launch/src/TasteDataCategoryMotion/README.md) · `TasteData-*`, `TasteCategory-*`, `TasteCategory-Collection` |
| **그래프 전환 영상 · 라인부터 파이까지** | 라인 → 씨앗·막대 → 원·캡슐 → 비교 영역 → 히트맵 → 트리맵 → 기본 음식 아이콘 버블 → 파이. 시작·종료 빈 구간은 각각 0.25초(총 0.5초)다. 완성된 일곱 그래프의 유지 시간은 모두 **60프레임·1초**다. 유지 구간은 라인 87~146, 막대 309~368, 비교 영역 713~772, 히트맵 1019~1078, 트리맵 1169~1228, 버블 1311~1370, 파이 1437~1496. 막대→비교 영역은 약 5.73초(노드 대기 0.2초·각 영역 성장 1.2초), 비교 영역→히트맵은 4.1초(역재생 1.2초·격자 분할 0.8초)다. 히트맵 색 단계 0.8초와 후반 전환·원본 기하·모션 곡선은 유지한다. 버블의 볶음·케이크·와인은 원본 기본 SVG로 고정하고 등장·퇴장 페이드만 적용한다. 파이는 원형 바깥 원호와 각도 축소를 유지하며 중앙 R을 단일 경로의 접선 원호로 계산한다. 별도 채움 레이어나 마스크는 없다. 최종 배치는 감칠맛 오른쪽·단맛 왼쪽 아래·쓴맛 왼쪽 위. 완성 파이 유지 뒤 1497~1551에 개별 파이의 반시계 순차 축소(0.9초)를 같은 렌더러로 재생하고, 1551~1565은 빈 끝 구간(0.25초)이다. 1080×1080·60fps·1566프레임(26.1초). 개별 그래프·아이콘 영상은 그대로다. 상세 전환 시각은 연결된 문서를 따른다. | [GraphMotion](../../brand-launch/src/GraphMotion/README.md) · `TasteGraph-Transition` |
| **미각 버블 맵** | 버블 순차 진입, 선택 확대·주변 밀어내기, 지도 이동·줌아웃, 외곽부터 소멸 | [TasteBubbleMapMotion](../../brand-launch/src/TasteBubbleMapMotion/README.md) · `TasteBubbleMap`, `TasteBubbleMap-Idle`, `TasteBubbleMap-Reduced` |
| **음식 이미지 전환** | 여섯 디시 탑뷰 이미지의 유지·디졸브 | [DishTopviews](../../brand-launch/src/DishTopviews/index.tsx) · `DishTopviews-Sequence` |

등록 진입점은 [Root.tsx](../../brand-launch/src/Root.tsx)와 각 폴더의 `index.tsx`다. `TasteBuddyLaunch`와 `Scenes`의 여섯 장면은 앱 소개 영상의 편집 구성으로 함께 보존한다. 화면 비율, 회전 레이어의 3×3 조합, 카테고리의 빈 데이터·정지·밀집 등의 예시는 별도 모션 종류로 중복 계산하지 않았다.

### 플랫폼과 보관본 구분

- 블룸 프레임과 소스 스플래터는 현재 Remotion 연출이다. 공통 iOS `bloom` / `feedback` 역할이 있다는 사실만으로 두 패턴의 네이티브 이식이 완료된 것은 아니다.
- 로고 스플래시에는 [웹 SplashLogo](../../src/components/graphics/SplashLogo.tsx)와 [iOS SplashView](../../ios/TasteBuddy/Features/Launch/SplashView.swift)가 별도로 존재한다. 카테고리 시각화에도 [iOS 구현](../../ios/TasteBuddy/Features/Gastronomy/TasteDataMotionView.swift)이 있다. 이번 작업에서는 실행을 재검증하지 않았다.
- 별도 BX Plan 사이트의 로컬 `public/motion-library.js`에는 14개 미디어 항목이 있다. 이 목록은 영상 자산 목록이며 최신 Studio 목록과 같지 않다. 예를 들어 `LogoGrid-Dynamic`은 사이트 목록에 남아 있지만 현재 Studio 등록은 제거되어 있고 이전 소스·출력만 보관된다.
- 플레이팅 명명과 공통 키프레임 등록은 기존 컴포지션 ID, Remotion 수식 또는 BX 사이트 배포본을 바꾸지 않는다. Android 공통 모션 런타임의 이식·실행 검증은 이 웹/iOS 명명 작업의 완료 범위에 포함하지 않는다.
