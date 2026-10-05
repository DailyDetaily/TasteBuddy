import { DiningFeedbackFlip } from "./DiningFeedbackMotion/Flip";
import { flipSchema } from "./DiningFeedbackMotion/flip-settings";
import { flipTiming } from "./DiningFeedbackMotion/flip-motion";
import { DishTopviewCompositions } from "./DishTopviews";
import { FoodIconCompositions } from "./FoodIcons";
import { TabBarPlusButton } from "./TabBarPlusButton/PlusButton";
import { plusButtonSchema } from "./TabBarPlusButton/settings";
import { BUTTON_FPS, buttonTiming } from "./TabBarPlusButton/motion";
import { TabBarCameraEntryPortrait } from "./TabBarCameraEntry/Portrait";
import { cameraEntrySchema } from "./TabBarCameraEntry/settings";
import { ENTRY_FPS, entryTiming } from "./TabBarCameraEntry/motion";
import { feedbackTiming } from "./TabBarCameraEntry/feedback-timing";
import {
  DiningFeedbackResult,
  DiningFeedbackCard,
  DiningFeedbackGradient,
} from "./DiningFeedbackMotion";
import { carouselSchema } from "./DiningFeedbackMotion/carousel-settings";
import { carouselTiming } from "./DiningFeedbackMotion/carousel-motion";
import "./index.css";
import { TasteBubbleMapCompositions } from "./TasteBubbleMapMotion";
import { KineticStatementsCompositions } from "./KineticStatements";
import { HomePeriodInsightMotion } from "./HomePeriodInsightMotion";
import { homePeriodMotionSchema } from "./HomePeriodInsightMotion/settings";
import { periodTiming } from "./HomePeriodInsightMotion/motion";
import { TasteBloomAvatarCompositions } from "./TasteBloomAvatars";
import { PetalLogoCompositions } from "./PetalLogo";
import { LogoGridCompositions } from "./LogoGrid";
import { TasteDataCategoryCompositions } from "./TasteDataCategoryMotion";
import { BarGraph } from "./GraphMotion/BarGraph";
import { GRAPH_FPS, barTiming } from "./GraphMotion/motion";
import { barGraphSchema } from "./GraphMotion/settings";
import { TasteChangeGraph } from "./GraphMotion/TasteChangeGraph";
import { tasteChangeGraphSchema } from "./GraphMotion/line-settings";
import { lineTiming } from "./GraphMotion/line-motion";
import { ReferenceTasteChangeGraph } from "./GraphMotion/ReferenceTasteChangeGraph";
import { referenceLineSchema } from "./GraphMotion/reference-settings";
import { referenceTiming } from "./GraphMotion/reference-motion";
import { TasteMotionCompositions } from "./TasteMotion";
import { Composition, Folder } from "remotion";
import { BrandLaunch } from "./BrandLaunch";
import { Opening } from "./scenes/Opening";
import { Feedback } from "./scenes/Feedback";
import { Connection } from "./scenes/Connection";
import { Record } from "./scenes/Record";
import { Insight } from "./scenes/Insight";
import { Signature } from "./scenes/Signature";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="App-UI">
        <Composition
          id="TabBar-PlusButton"
          component={TabBarPlusButton}
          schema={plusButtonSchema}
          defaultProps={{
            재생: "반복" as const,
            상태: "기본" as const,
            "버튼 크기": 360,
            속도: 1,
            "시작 색 조합": "파랑 · 초록" as const,
            "글래스 강도": 1,
            "배경 색": "#F3F3F3",
          }}
          width={1080}
          height={1080}
          fps={BUTTON_FPS}
          durationInFrames={buttonTiming(1).durationInFrames}
          calculateMetadata={({ props }) => ({
            durationInFrames: buttonTiming(props.속도).durationInFrames,
          })}
        />
        <Composition
          id="TabBar-CameraEntry-Portrait"
          component={TabBarCameraEntryPortrait}
          schema={cameraEntrySchema}
          defaultProps={{
            "캔버스 배경": "#ffffff",
            "화면 높이": 980,
            "클릭 전 대기": 1.2,
            "누름 시간": 0.24,
            "진입 속도": 1,
            "카메라 유지 시간": 5,
            "버튼 크기": 144,
            "하단 여백": 192,
            "컬러 모드": "블루 · 퍼플" as const,
            "색 전환 간격": 0.75,
            "랜덤 시드": 29,
            "글래스 강도": 1,
            "배경 색": "#FFFFFF",
          }}
          width={1920}
          height={1280}
          fps={ENTRY_FPS}
          durationInFrames={2189}
          calculateMetadata={({ props }) => ({
            durationInFrames:
              entryTiming(props).durationInFrames +
              feedbackTiming(ENTRY_FPS).durationInFrames,
          })}
        />
      </Folder>
      <DishTopviewCompositions />
      <FoodIconCompositions />
      <Folder name="Dining-Feedback">
        <Composition
          id="DiningFeedback-Flip"
          component={DiningFeedbackFlip}
          schema={flipSchema}
          defaultProps={{
            재생: "자동 플립",
            "카드 유지 시간": 1.5,
            "접힘 시간": 0.32,
            "펼침 시간": 0.48,
            "플립 방향": "왼쪽",
            "배경 속도": 2,
            "정지 카드": 1,
            카드: [
              {
                "사진 경로": "brand/dish-topviews/dish-19.png",
                메뉴명: "단호박 라비올리",
                식당명: "오르토 루체",
                "메인 컬러": "단맛",
                "보조 컬러": "지방맛",
                "세 번째 컬러": "감칠맛",
                "맛 반응": [
                  { 미각: "단맛", 문구: "밀도 있는 단맛" },
                  { 미각: "지방맛", 문구: "버터리함" },
                  { 미각: "감칠맛", 문구: "은근한 깊이" },
                ],
                "상세 태그": ["부드러움", "밀도 있음", "재료 간 연결이 좋음"],
                "미식 노트":
                  "단호박 속이 알차고 버터 소스도 잘 어울렸다. 마지막 한 입까지 기분 좋게 먹었다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-12.png",
                메뉴명: "시트러스 타르트",
                식당명: "직접 만든 요리",
                "메인 컬러": "신맛",
                "보조 컬러": "단맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "신맛", 문구: "시트러스 산미" },
                  { 미각: "단맛", 문구: "깔끔한 단맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["과일 향", "바삭함"],
                "미식 노트":
                  "크림의 산미는 마음에 들지만 바닥이 생각보다 두꺼웠다. 다음엔 반죽을 더 얇게 밀어볼 것.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-16.png",
                메뉴명: "구운 관자와 리크",
                식당명: "리에르 테이블",
                "메인 컬러": "쓴맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "쓴맛", 문구: "쌉싸름한 여운" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": [
                  "구운 향",
                  "수분감 있음",
                  "부드러움",
                  "오래 남음",
                ],
                "미식 노트":
                  "관자는 부드러웠는데 리크의 쌉싸름함이 오래 남았다. 내 입맛에는 채소를 조금 덜 구운 쪽이 좋겠다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-18.png",
                메뉴명: "캐비아 타르틀렛",
                식당명: "메종 네리브",
                "메인 컬러": "짠맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "짠맛", 문구: "선명한 짠맛" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["해산물 향", "간이 선명함"],
                "미식 노트":
                  "톡톡 터지는 식감은 재미있었다. 다만 내겐 간이 세서 한 입 이상 먹으면 부담스러울 듯.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-20.png",
                메뉴명: "조개와 버섯 브로스",
                식당명: "마레 앤 포레",
                "메인 컬러": "감칠맛",
                "보조 컬러": "짠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "감칠맛", 문구: "맑은 감칠맛" },
                  { 미각: "짠맛", 문구: "맑은 해수감" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": ["해산물 향", "흙내음", "따뜻하게 퍼짐"],
                "미식 노트":
                  "뜨거울 때는 조개 향이 먼저, 식으니 버섯 향이 더 또렷했다. 비 오는 날 다시 먹고 싶은 국물.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-15.png",
                메뉴명: "오리 콩피",
                식당명: "비스트로 루벨",
                "메인 컬러": "지방맛",
                "주색 영역 비중": 0.8,
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "짠맛",
                "맛 반응": [
                  { 미각: "지방맛", 문구: "풍성한 지방감" },
                  { 미각: "감칠맛", 문구: "육향의 감칠맛" },
                  { 미각: "짠맛", 문구: "풍미를 살린 간" },
                ],
                "상세 태그": [
                  "바삭함",
                  "육향",
                  "코팅감 있음",
                  "마무리가 무거움",
                ],
                "미식 노트":
                  "첫 몇 입은 바삭하고 고소해서 좋았다. 끝에는 조금 무거워져서 산미 있는 곁들임이 있으면 더 좋겠다.",
              },
            ],
          }}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={414}
          calculateMetadata={({ props }) => ({
            durationInFrames: flipTiming(props).durationInFrames,
          })}
        />
        <Composition
          id="DiningFeedback-Result"
          component={DiningFeedbackResult}
          schema={carouselSchema}
          defaultProps={{
            재생: "자동 스크롤",
            "카드 유지 시간": 0,
            "스크롤 시간": 2.5,
            "주변 카드 불투명도": 1,
            "카드 간격": 24,
            "배경 속도": 2,
            "정지 카드": 1,
            카드: [
              {
                "사진 경로": "brand/dish-topviews/dish-19.png",
                메뉴명: "단호박 라비올리",
                식당명: "오르토 루체",
                "메인 컬러": "단맛",
                "보조 컬러": "지방맛",
                "세 번째 컬러": "감칠맛",
                "맛 반응": [
                  { 미각: "단맛", 문구: "밀도 있는 단맛" },
                  { 미각: "지방맛", 문구: "버터리함" },
                  { 미각: "감칠맛", 문구: "은근한 깊이" },
                ],
                "상세 태그": ["부드러움", "밀도 있음", "재료 간 연결이 좋음"],
                "미식 노트":
                  "단호박 속이 알차고 버터 소스도 잘 어울렸다. 마지막 한 입까지 기분 좋게 먹었다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-12.png",
                메뉴명: "시트러스 타르트",
                식당명: "직접 만든 요리",
                "메인 컬러": "신맛",
                "보조 컬러": "단맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "신맛", 문구: "시트러스 산미" },
                  { 미각: "단맛", 문구: "깔끔한 단맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["과일 향", "바삭함"],
                "미식 노트":
                  "크림의 산미는 마음에 들지만 바닥이 생각보다 두꺼웠다. 다음엔 반죽을 더 얇게 밀어볼 것.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-16.png",
                메뉴명: "구운 관자와 리크",
                식당명: "리에르 테이블",
                "메인 컬러": "쓴맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "쓴맛", 문구: "쌉싸름한 여운" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": [
                  "구운 향",
                  "수분감 있음",
                  "부드러움",
                  "오래 남음",
                ],
                "미식 노트":
                  "관자는 부드러웠는데 리크의 쌉싸름함이 오래 남았다. 내 입맛에는 채소를 조금 덜 구운 쪽이 좋겠다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-18.png",
                메뉴명: "캐비아 타르틀렛",
                식당명: "메종 네리브",
                "메인 컬러": "짠맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "짠맛", 문구: "선명한 짠맛" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["해산물 향", "간이 선명함"],
                "미식 노트":
                  "톡톡 터지는 식감은 재미있었다. 다만 내겐 간이 세서 한 입 이상 먹으면 부담스러울 듯.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-20.png",
                메뉴명: "조개와 버섯 브로스",
                식당명: "마레 앤 포레",
                "메인 컬러": "감칠맛",
                "보조 컬러": "짠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "감칠맛", 문구: "맑은 감칠맛" },
                  { 미각: "짠맛", 문구: "맑은 해수감" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": ["해산물 향", "흙내음", "따뜻하게 퍼짐"],
                "미식 노트":
                  "뜨거울 때는 조개 향이 먼저, 식으니 버섯 향이 더 또렷했다. 비 오는 날 다시 먹고 싶은 국물.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-15.png",
                메뉴명: "오리 콩피",
                식당명: "비스트로 루벨",
                "메인 컬러": "지방맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "짠맛",
                "맛 반응": [
                  { 미각: "지방맛", 문구: "풍성한 지방감" },
                  { 미각: "감칠맛", 문구: "육향의 감칠맛" },
                  { 미각: "짠맛", 문구: "풍미를 살린 간" },
                ],
                "상세 태그": [
                  "바삭함",
                  "육향",
                  "코팅감 있음",
                  "마무리가 무거움",
                ],
                "미식 노트":
                  "첫 몇 입은 바삭하고 고소해서 좋았다. 끝에는 조금 무거워져서 산미 있는 곁들임이 있으면 더 좋겠다.",
              },
            ],
          }}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={450}
          calculateMetadata={({ props }) => ({
            durationInFrames: carouselTiming(props).durationInFrames,
          })}
        />
        <Composition
          id="DiningFeedback-Card"
          component={DiningFeedbackCard}
          schema={carouselSchema}
          defaultProps={{
            재생: "자동 스크롤",
            "카드 유지 시간": 0,
            "스크롤 시간": 2.5,
            "주변 카드 불투명도": 1,
            "카드 간격": 24,
            "배경 속도": 2,
            "정지 카드": 1,
            카드: [
              {
                "사진 경로": "brand/dish-topviews/dish-19.png",
                메뉴명: "단호박 라비올리",
                식당명: "오르토 루체",
                "메인 컬러": "단맛",
                "보조 컬러": "지방맛",
                "세 번째 컬러": "감칠맛",
                "맛 반응": [
                  { 미각: "단맛", 문구: "밀도 있는 단맛" },
                  { 미각: "지방맛", 문구: "버터리함" },
                  { 미각: "감칠맛", 문구: "은근한 깊이" },
                ],
                "상세 태그": ["부드러움", "밀도 있음", "재료 간 연결이 좋음"],
                "미식 노트":
                  "단호박 속이 알차고 버터 소스도 잘 어울렸다. 마지막 한 입까지 기분 좋게 먹었다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-12.png",
                메뉴명: "시트러스 타르트",
                식당명: "직접 만든 요리",
                "메인 컬러": "신맛",
                "보조 컬러": "단맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "신맛", 문구: "시트러스 산미" },
                  { 미각: "단맛", 문구: "깔끔한 단맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["과일 향", "바삭함"],
                "미식 노트":
                  "크림의 산미는 마음에 들지만 바닥이 생각보다 두꺼웠다. 다음엔 반죽을 더 얇게 밀어볼 것.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-16.png",
                메뉴명: "구운 관자와 리크",
                식당명: "리에르 테이블",
                "메인 컬러": "쓴맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "쓴맛", 문구: "쌉싸름한 여운" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": [
                  "구운 향",
                  "수분감 있음",
                  "부드러움",
                  "오래 남음",
                ],
                "미식 노트":
                  "관자는 부드러웠는데 리크의 쌉싸름함이 오래 남았다. 내 입맛에는 채소를 조금 덜 구운 쪽이 좋겠다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-18.png",
                메뉴명: "캐비아 타르틀렛",
                식당명: "메종 네리브",
                "메인 컬러": "짠맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "짠맛", 문구: "선명한 짠맛" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["해산물 향", "간이 선명함"],
                "미식 노트":
                  "톡톡 터지는 식감은 재미있었다. 다만 내겐 간이 세서 한 입 이상 먹으면 부담스러울 듯.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-20.png",
                메뉴명: "조개와 버섯 브로스",
                식당명: "마레 앤 포레",
                "메인 컬러": "감칠맛",
                "보조 컬러": "짠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "감칠맛", 문구: "맑은 감칠맛" },
                  { 미각: "짠맛", 문구: "맑은 해수감" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": ["해산물 향", "흙내음", "따뜻하게 퍼짐"],
                "미식 노트":
                  "뜨거울 때는 조개 향이 먼저, 식으니 버섯 향이 더 또렷했다. 비 오는 날 다시 먹고 싶은 국물.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-15.png",
                메뉴명: "오리 콩피",
                식당명: "비스트로 루벨",
                "메인 컬러": "지방맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "짠맛",
                "맛 반응": [
                  { 미각: "지방맛", 문구: "풍성한 지방감" },
                  { 미각: "감칠맛", 문구: "육향의 감칠맛" },
                  { 미각: "짠맛", 문구: "풍미를 살린 간" },
                ],
                "상세 태그": [
                  "바삭함",
                  "육향",
                  "코팅감 있음",
                  "마무리가 무거움",
                ],
                "미식 노트":
                  "첫 몇 입은 바삭하고 고소해서 좋았다. 끝에는 조금 무거워져서 산미 있는 곁들임이 있으면 더 좋겠다.",
              },
            ],
          }}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={450}
          calculateMetadata={({ props }) => ({
            durationInFrames: carouselTiming(props).durationInFrames,
          })}
        />
        <Composition
          id="DiningFeedback-Gradient"
          component={DiningFeedbackGradient}
          schema={carouselSchema}
          defaultProps={{
            재생: "자동 스크롤",
            "카드 유지 시간": 0,
            "스크롤 시간": 2.5,
            "주변 카드 불투명도": 1,
            "카드 간격": 24,
            "배경 속도": 2,
            "정지 카드": 1,
            카드: [
              {
                "사진 경로": "brand/dish-topviews/dish-19.png",
                메뉴명: "단호박 라비올리",
                식당명: "오르토 루체",
                "메인 컬러": "단맛",
                "보조 컬러": "지방맛",
                "세 번째 컬러": "감칠맛",
                "맛 반응": [
                  { 미각: "단맛", 문구: "밀도 있는 단맛" },
                  { 미각: "지방맛", 문구: "버터리함" },
                  { 미각: "감칠맛", 문구: "은근한 깊이" },
                ],
                "상세 태그": ["부드러움", "밀도 있음", "재료 간 연결이 좋음"],
                "미식 노트":
                  "단호박 속이 알차고 버터 소스도 잘 어울렸다. 마지막 한 입까지 기분 좋게 먹었다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-12.png",
                메뉴명: "시트러스 타르트",
                식당명: "직접 만든 요리",
                "메인 컬러": "신맛",
                "보조 컬러": "단맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "신맛", 문구: "시트러스 산미" },
                  { 미각: "단맛", 문구: "깔끔한 단맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["과일 향", "바삭함"],
                "미식 노트":
                  "크림의 산미는 마음에 들지만 바닥이 생각보다 두꺼웠다. 다음엔 반죽을 더 얇게 밀어볼 것.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-16.png",
                메뉴명: "구운 관자와 리크",
                식당명: "리에르 테이블",
                "메인 컬러": "쓴맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "쓴맛", 문구: "쌉싸름한 여운" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": [
                  "구운 향",
                  "수분감 있음",
                  "부드러움",
                  "오래 남음",
                ],
                "미식 노트":
                  "관자는 부드러웠는데 리크의 쌉싸름함이 오래 남았다. 내 입맛에는 채소를 조금 덜 구운 쪽이 좋겠다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-18.png",
                메뉴명: "캐비아 타르틀렛",
                식당명: "메종 네리브",
                "메인 컬러": "짠맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "짠맛", 문구: "선명한 짠맛" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["해산물 향", "간이 선명함"],
                "미식 노트":
                  "톡톡 터지는 식감은 재미있었다. 다만 내겐 간이 세서 한 입 이상 먹으면 부담스러울 듯.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-20.png",
                메뉴명: "조개와 버섯 브로스",
                식당명: "마레 앤 포레",
                "메인 컬러": "감칠맛",
                "보조 컬러": "짠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "감칠맛", 문구: "맑은 감칠맛" },
                  { 미각: "짠맛", 문구: "맑은 해수감" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": ["해산물 향", "흙내음", "따뜻하게 퍼짐"],
                "미식 노트":
                  "뜨거울 때는 조개 향이 먼저, 식으니 버섯 향이 더 또렷했다. 비 오는 날 다시 먹고 싶은 국물.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-15.png",
                메뉴명: "오리 콩피",
                식당명: "비스트로 루벨",
                "메인 컬러": "지방맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "짠맛",
                "맛 반응": [
                  { 미각: "지방맛", 문구: "풍성한 지방감" },
                  { 미각: "감칠맛", 문구: "육향의 감칠맛" },
                  { 미각: "짠맛", 문구: "풍미를 살린 간" },
                ],
                "상세 태그": [
                  "바삭함",
                  "육향",
                  "코팅감 있음",
                  "마무리가 무거움",
                ],
                "미식 노트":
                  "첫 몇 입은 바삭하고 고소해서 좋았다. 끝에는 조금 무거워져서 산미 있는 곁들임이 있으면 더 좋겠다.",
              },
            ],
          }}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={450}
          calculateMetadata={({ props }) => ({
            durationInFrames: carouselTiming(props).durationInFrames,
          })}
        />
      </Folder>
      <KineticStatementsCompositions />
      <TasteBubbleMapCompositions />
      <Folder name="Card-Motion">
        <Composition
          id="HomePeriodInsightCard"
          component={HomePeriodInsightMotion}
          schema={homePeriodMotionSchema}
          fps={30}
          width={1920}
          height={1080}
          durationInFrames={120}
          calculateMetadata={({ props }) => ({
            durationInFrames: periodTiming(props).durationInFrames,
          })}
          defaultProps={{
            재생: "전체 모션",
            "카드 간격": 12,
            "화면 배율": 1.8,
            "카드 시차": 0.16,
            "정지 시간": 1.5,
            "배경 색": "#F3F3F3",
            카드: [
              {
                종류: "tasteChange",
                제목: "단맛과 감칠맛 반응이 현재 기준에서 달라요",
                설명: "",
                기록: [],
                섹션명: "미각변화",
                키워드: [],
                미각: "기본",
                "가로 그래프": [
                  { 미각: "단맛", 기록: [0, 0, 5, 3, 10, 10, 15.2] },
                  { 미각: "감칠맛", 기록: [0, 0, -4, -4, -7, -6, -10.7] },
                ],
              },
              {
                종류: "recordFlow",
                제목: "4번 기록",
                설명: "이전 7일보다 2번 더 기록했어요.",
                기록: [0, 1, 0, 1, 0, 1, 1],
                섹션명: "",
                미각: "기본",
              },
              {
                종류: "experienceBreadth",
                제목: "메뉴 12개",
                설명: "레스토랑 8곳",
                기록: [2, 4, 3, 7, 5, 9, 6, 10, 4, 8, 7, 12],
                섹션명: "",
                미각: "기본",
              },
            ],
          }}
        />
      </Folder>
      <Folder name="Graph-Motion">
        <Composition
          id="TasteGraph-TasteChange-Reference"
          component={ReferenceTasteChangeGraph}
          schema={referenceLineSchema}
          fps={GRAPH_FPS}
          width={1080}
          height={1080}
          durationInFrames={112}
          calculateMetadata={({ props }) => ({
            durationInFrames: referenceTiming(props).durationInFrames,
          })}
          defaultProps={{
            재생: "진입·유지·퇴장",
            "높낮이 배율": 3,
            "시작 대기": 0.36,
            "진입 시간": 1.04,
            "행 간 지연": 0,
            "유지 시간": 0.84,
            "끝 여백": 0.44,
            "배경 색": "#FFFFFF",
            "라벨 표시": false,
            "첫 기록 대기선": true,
            데이터: [
              { 미각: "단맛", 기록: [0, 0, 5, 3, 10, 10, 15.2] },
              { 미각: "감칠맛", 기록: [0, 0, -4, -4, -7, -6, -10.7] },
            ],
          }}
        />
        <Composition
          id="TasteGraph-TasteChange"
          component={TasteChangeGraph}
          schema={tasteChangeGraphSchema}
          fps={GRAPH_FPS}
          width={1080}
          height={1080}
          durationInFrames={195}
          calculateMetadata={({ props }) => ({
            durationInFrames: lineTiming(props).durationInFrames,
          })}
          defaultProps={{
            재생: "진입·유지·퇴장",
            "진입 시간": 1.4,
            "행 간 지연": 0.14,
            "유지 시간": 3,
            "배경 색": "#FFFFFF",
            "라벨 표시": false,
            "첫 기록 대기선": true,
            데이터: [
              { 미각: "단맛", 기록: [-6, -2, 5, 12] },
              { 미각: "짠맛", 기록: [10, 6, -2, -8] },
            ],
          }}
        />
        <Composition
          id="TasteGraph-Bar"
          component={BarGraph}
          schema={barGraphSchema}
          fps={GRAPH_FPS}
          width={1080}
          height={1080}
          durationInFrames={211}
          calculateMetadata={({ props }) => ({
            durationInFrames: barTiming(props).durationInFrames,
          })}
          defaultProps={{
            형태: "상세" as const,
            색상: "감칠맛" as const,
            끝점: "마지막 막대" as const,
            재생: "진입·유지·퇴장" as const,
            "진입 시간": 1.2,
            "막대 간 지연": 0.1,
            "유지 시간": 3,
            "수치와 라벨": false,
            "배경 색": "#FFFFFF",
            데이터: [
              { 항목: "월", 값: 2 },
              { 항목: "화", 값: 4 },
              { 항목: "수", 값: 3 },
              { 항목: "목", 값: 6 },
              { 항목: "금", 값: 4 },
              { 항목: "토", 값: 7 },
              { 항목: "일", 값: 5 },
            ],
          }}
        />
        <Composition
          id="TasteGraph-Bar-Home"
          component={BarGraph}
          schema={barGraphSchema}
          fps={GRAPH_FPS}
          width={1080}
          height={1080}
          durationInFrames={211}
          calculateMetadata={({ props }) => ({
            durationInFrames: barTiming(props).durationInFrames,
          })}
          defaultProps={{
            형태: "홈 미니",
            색상: "감칠맛",
            끝점: "마지막 막대",
            재생: "진입·유지·퇴장",
            "진입 시간": 1.2,
            "막대 간 지연": 0.1,
            "유지 시간": 3,
            "수치와 라벨": false,
            "배경 색": "#FFFFFF",
            데이터: [
              { 항목: "월", 값: 2 },
              { 항목: "화", 값: 4 },
              { 항목: "수", 값: 3 },
              { 항목: "목", 값: 6 },
              { 항목: "금", 값: 4 },
              { 항목: "토", 값: 7 },
              { 항목: "일", 값: 5 },
            ],
          }}
        />
        <Composition
          id="TasteGraph-Bar-Distribution"
          component={BarGraph}
          schema={barGraphSchema}
          fps={GRAPH_FPS}
          width={1080}
          height={1080}
          durationInFrames={199}
          calculateMetadata={({ props }) => ({
            durationInFrames: barTiming(props).durationInFrames,
          })}
          defaultProps={{
            형태: "상세",
            색상: "단맛",
            끝점: "모든 막대",
            재생: "진입·유지·퇴장",
            "진입 시간": 1.2,
            "막대 간 지연": 0.1,
            "유지 시간": 3,
            "수치와 라벨": true,
            "배경 색": "#FFFFFF",
            데이터: [
              { 항목: "1점", 값: 0 },
              { 항목: "2점", 값: 2 },
              { 항목: "3점", 값: 4 },
              { 항목: "4점", 값: 7 },
              { 항목: "5점", 값: 3 },
            ],
          }}
        />
      </Folder>
      <TasteBloomAvatarCompositions />
      <PetalLogoCompositions />
      <LogoGridCompositions />
      <TasteMotionCompositions />
      <TasteDataCategoryCompositions />
      <Composition
        id="TasteBuddyLaunch"
        component={BrandLaunch}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Folder name="Scenes">
        <Composition
          id="Opening"
          component={Opening}
          durationInFrames={102}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Record"
          component={Record}
          durationInFrames={162}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Feedback"
          component={Feedback}
          durationInFrames={192}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Insight"
          component={Insight}
          durationInFrames={252}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Connection"
          component={Connection}
          durationInFrames={162}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Signature"
          component={Signature}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
