// 구현 결과로 정답을 만들지 않는 추가 수작업 가상 사례다. 미공개 홀드아웃은 아니다.
export const VALIDATION_CASES_VERSION = 'tba-engine-review-cases/1';
export const VALIDATION_CASES = [
  {
    id: 'V01', title: '강한 감각과 음식 전체 호감을 분리한다',
    records: [{ text: '감칠맛이 강했어요. 전체적으로 좋았어요.' }, { text: '감칠맛이 강했어요. 전체적으로 좋았어요.' }],
    expected: { main: null, wing: null, required: [{ record: 0, kind: 'sensory_intensity', attribute: 'taste.umami', value: 'strong' }, { record: 0, kind: 'overall_liking', value: 'positive' }], forbidden: [{ kind: 'attribute_liking', value: 'positive' }] },
    review: '감칠맛이 강했다고 느낀 기록을 감칠맛 선호 또는 강렬형으로 설명하지 않는다.',
  },
  {
    id: 'V02', title: '싫지 않음을 좋아함으로 바꾸지 않는다',
    records: [{ text: '단맛이 싫지 않았어요.' }, { text: '단맛이 싫지 않았어요.' }],
    expected: { main: null, wing: null, forbidden: [{ kind: 'attribute_liking', value: 'positive' }, { kind: 'attribute_liking', value: 'negative' }] },
    review: '명시적 호감이나 혐오로 확정하지 않는다. 중립 기록 또는 미확정 상태를 유지한다.',
  },
  {
    id: 'V03', title: '타인의 평가를 내 취향에 합치지 않는다',
    records: [{ text: '친구는 구운 향이 좋았다고 했어요.' }, { text: '친구는 구운 향이 좋았다고 했어요.' }],
    expected: { main: null, wing: null, forbidden: [{ kind: 'attribute_liking' }] },
    review: '친구의 호감을 사용자의 직접 평가로 제시하지 않는다.',
  },
  {
    id: 'V04', title: '음식 이름에서 취향을 만들지 않는다',
    records: [{ food: '달콤한 꿀 케이크', text: '기억이 잘 안 나요.' }, { food: '고소한 견과 쿠키', text: '기억이 잘 안 나요.' }],
    expected: { main: null, wing: null, forbidden: [{ kind: 'attribute_liking' }, { kind: 'sensory_presence' }] },
    review: '음식명에 적힌 감각을 사용자가 느끼거나 좋아한 것으로 바꾸지 않는다.',
  },
  {
    id: 'V05', title: '같은 음식의 소스와 튀김옷을 구분한다',
    records: [{ text: '소스의 단맛이 좋았어요. 튀김옷의 단맛이 싫었어요.' }, { text: '소스의 단맛이 좋았어요. 튀김옷의 단맛이 싫었어요.' }],
    expected: { main: null, wing: null, required: [{ record: 0, kind: 'attribute_liking', attribute: 'taste.sweet', target: 'sauce', value: 'positive' }, { record: 0, kind: 'attribute_liking', attribute: 'taste.sweet', target: 'coating', value: 'negative' }], forbidden: [{ kind: 'attribute_liking', target: 'whole_dish' }] },
    review: '부위별 반응 차이를 보존한다. 음식 전체의 단맛 선호 또는 부위가 차이의 원인이라는 단정은 금지한다.',
  },
  {
    id: 'V06', title: '식사 초반과 나중의 반응을 구분한다',
    records: [{ text: '처음엔 단맛이 좋았어요. 나중에는 단맛이 싫었어요.' }, { text: '처음엔 단맛이 좋았어요. 나중에는 단맛이 싫었어요.' }],
    expected: { main: null, wing: null, required: [{ record: 0, kind: 'attribute_liking', attribute: 'taste.sweet', phase: 'early_meal', value: 'positive' }, { record: 0, kind: 'attribute_liking', attribute: 'taste.sweet', phase: 'late_meal', value: 'negative' }], forbidden: [{ phase: 'first_bite' }] },
    review: '초반을 첫입으로 좁히지 않는다. 식사 안의 변화를 장기간 취향 변화로 설명하지 않는다.',
  },
  {
    id: 'V07', title: '한 식사에 접시가 많아도 반복 식사가 아니다',
    records: [{ text: '바삭함이 좋았어요.', meal: 'shared' }, { text: '바삭함이 좋았어요.', meal: 'shared' }, { text: '바삭함이 좋았어요.', meal: 'shared' }],
    expected: { main: null, wing: null, meals: 1, required: [{ record: 0, kind: 'attribute_liking', attribute: 'texture.crisp', value: 'positive' }] },
    review: '세 접시를 서로 다른 식사 세 번의 호감으로 소개하지 않는다.',
  },
  {
    id: 'V08', title: '같은 타입 조합이라도 구운 향을 즐긴 기록을 설명한다',
    records: [{ food: '가상 타르트', text: '단맛이 좋았어요. 구운 향이 좋았어요.' }, { food: '가상 비스킷', text: '단맛이 좋았어요. 구운 향이 좋았어요.' }, { food: '가상 젤리', text: '단맛이 좋았어요.' }],
    expected: { main: 'romantic', wing: 'roaster', required: [{ record: 0, kind: 'attribute_liking', attribute: 'aroma.roasted', value: 'positive' }] },
    review: '구운 향에 대한 반복 호감을 인용한다. 단맛과 구운 향을 함께 먹어서 좋아했다는 조합 인과를 만들지 않는다.',
    compareGroup: 'same-profile-different-evidence',
  },
  {
    id: 'V09', title: '같은 타입 조합이라도 구수한 맛을 즐긴 기록을 설명한다',
    records: [{ food: '가상 곡물 푸딩', text: '단맛이 좋았어요. 구수한 맛이 좋았어요.' }, { food: '가상 곡물 음료', text: '단맛이 좋았어요. 구수한 맛이 좋았어요.' }, { food: '가상 과일 디저트', text: '단맛이 좋았어요.' }],
    expected: { main: 'romantic', wing: 'roaster', required: [{ record: 0, kind: 'attribute_liking', attribute: 'flavor.cereal_savory', value: 'positive' }], forbidden: [{ attribute: 'aroma.roasted' }] },
    review: '구수함을 구운 향이나 실제 곡물 성분의 검증 결과로 바꾸지 않는다. V08과 동일한 타입 소개문을 재사용하지 않는다.',
    compareGroup: 'same-profile-different-evidence',
  },
  {
    id: 'V10', title: '강도 보고가 충돌하면 강렬형을 유보한다',
    records: [{ text: '매운맛이 강했어요. 매운맛이 약했어요. 매운맛이 좋았어요.' }, { text: '매운맛이 강했어요. 매운맛이 약했어요. 매운맛이 좋았어요.' }],
    expected: { main: null, wing: null, required: [{ record: 0, kind: 'sensory_intensity', value: 'strong' }, { record: 0, kind: 'sensory_intensity', value: 'weak' }, { record: 0, kind: 'attribute_liking', value: 'positive' }], unsupportedStyles: ['maximalist'] },
    review: '같은 범위에 강함과 약함이 함께 있다. 매운맛의 호감은 보존하되 강한 자극을 좋아한다는 설명은 유보한다.',
  },
  {
    id: 'V11', title: '감각이 없어서 좋다는 조건을 보존한다',
    records: [{ text: '안 달아서 좋았어요.' }, { text: '안 달아서 좋았어요.' }],
    expected: { main: null, wing: null, required: [{ record: 0, kind: 'sensory_presence', attribute: 'taste.sweet', value: false }], unsupportedStyles: ['romantic'] },
    review: '단맛이 없었던 경험의 호감을 단맛 자체의 호감이나 모든 단 음식의 혐오로 바꾸지 않는다.',
  },
  {
    id: 'V12', title: '문맥 연결이 필요한 조합은 확인 전까지 남긴다',
    records: [{ text: '소스의 단맛과 튀김옷의 바삭함이 함께 먹으니 좋았어요.' }, { text: '소스의 단맛과 튀김옷의 바삭함이 함께 먹으니 좋았어요.' }],
    expected: { main: null, wing: null, unresolvedMinimum: 1, forbidden: [{ kind: 'attribute_liking', value: 'positive' }] },
    review: '각 감각의 개별 호감을 만들지 않는다. API 미연결 상태의 문맥 해석 누락을 성공으로 집계하지 않는다.',
  },
];
