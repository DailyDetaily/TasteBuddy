const RESTAURANT_NAME_BY_SLUG = {
  '7th-door-seoul': '세븐도어',
  'eatanic-garden-seoul': '이타닉가든',
  evett: '에빗',
  jungsik: '정식당',
  'jungsik-seoul': '정식당',
  kwonsooksoo: '권숙수',
  'la-yeon-seoul': '라연',
  'mingles-seoul': '밍글스',
  mitou: '미토우',
  'onjium-seoul': '온지음',
  soigneseoul: '스와니예',
  'sosuheon-seoul': '소수헌',
  allaprima: '알라프리마',
  tempmosuseoul: '모수',
};

const RESTAURANT_NAME_TRANSLATIONS = {
  '7TH DOOR': '세븐도어',
  '7TH DOOR SEOUL': '세븐도어',
  'EATANIC GARDEN': '이타닉가든',
  EVETT: '에빗',
  JUNGSIK: '정식당',
  JUNGSIKSEOUL: '정식당',
  KWONSOOKSOO: '권숙수',
  MINGLES: '밍글스',
  MITOU: '미토우',
  ONJIUM: '온지음',
  'SOIGNE': '스와니예',
  'ALLA PRIMA': '알라프리마',
  'MOSU SEOUL': '모수',
  'MOSU SEOUL BY CHEF SUNG ANH': '모수',
  'LA YEON': '라연',
  'RESTAURANT ALLEN': '레스토랑 알렌',
  SOSUHEON: '소수헌',
};

const CHEF_NAME_TRANSLATIONS = {
  'CHO EUN-HEE / PARK SUNG-BAE': '조은희 / 박성배',
  'JOSEPH LIDGERWOOD': '조셉 리저우드',
  'KIM DAE-CHUN': '김대천',
  'KIM JIN HYEOK': '김진혁',
  'KWON SOOK SOO': '권숙수',
  'KWON WOO-JOONG': '권우중',
  'MINGOO KANG': '강민구',
  'SUNG ANH': '안성재',
  'SON JONG-WON': '손종원',
  'SEO HYUN-MIN': '서현민',
  'SUH HYUN-MIN': '서현민',
  'KIM SUNG IL': '김성일',
  'PARK KYUNG-JAE': '박경재',
  'LEE JUN': '이준',
  'YIM JUNG-SIK': '임정식',
};

const DISH_TITLE_TRANSLATIONS = {
  ABALONE: '전복',
  'ADD SEA URCHIN': '성게 추가',
  'ALL IN ONE GIMBAP': '올인원 김밥',
  BANCHAN: '반찬',
  BUGAK: '부각',
  'DEODEOK ROOT': '더덕',
  'DO SEA URCHIN': '성게 추가',
  'DOLHAREUBANG OR NY-SEOUL': '돌하르방 또는 NY-서울',
  'DOLHAREUBANG OR ULLEUNGDO': '돌하르방 또는 울릉도',
  'DOLHAREUBANG OR ULLEUNGDO MAPLE': '돌하르방 또는 울릉도 메이플',
  'DUCK OR HANWOO GALBI': '오리 또는 한우 갈비',
  'GAMTAE GUKSU': '감태 국수',
  GIMBAP: '김밥',
  GOGUMA: '고구마',
  HWACHAE: '화채',
  'JEON BOK JJIM': '능이전복탕',
  'JUNGSIK SALMON': '정식당 연어',
  MAPLE: '메이플',
  'MOTHER OF PEARL BOX': '자개함',
  'NY-SEOUL': 'NY-서울',
  'NOK DU JEON & JEUP JANG': '녹두전과 즙장',
  'SONG I MAN DU': '송이만두',
  'SUCK OR HANWOO GALB': '오리 또는 한우 갈비',
  'SWEET NY-SEOUL': '스위트 NY-서울',
  'SWEET ULLEUNGDO MAPLE': '스위트 울릉도 메이플',
  'TRUFFLE MUGUK': '트러플 뭇국',
  'ULLEUNGDO MAPLE': '울릉도 메이플',
  'URCHIN BIBIMBAP': '성게 비빔밥',
  'URCHIN GUJEOLPAN': '성게 구절판',
  'YELLOWTAIL GIMBAP': '방어 김밥',
  'ASIAN PEAR SHERBET': '향설빙',
  'BAEK HWA BAN': '백화반',
  'BULGOGI': '불고기',
  'BLACK SESAME TOFU': '흑임자 두부',
  CHESTNUT: '밤',
  'DEODEOK & PINE NUT': '더덕과 잣',
  'DEODEOK, HOE-DEOPBAP, NURUNGI': '더덕, 회덮밥, 누룽지',
  'DEODEOK, HOE-DEOPBAP, NURUNG)I': '더덕, 회덮밥, 누룽지',
  'EMBER ROASTED ACORN NOODLE': '참나무 불향 도토리면',
  'FISH JORIM': '생선 조림',
  GINGER: '생강',
  'GYE JA CHAE': '겨자채',
  'HANG SEOUL BING': '향설빙',
  'HANWOO B.L.T': '한우 B.L.T',
  'HANWOO BEEF': '한우',
  'HARWOO BEEF': '한우',
  'HANJAE WATER PARSLEY': '한재 미나리',
  'HYANG SEOL BING': '향설빙',
  'JUNAMI RICE': '주나미 쌀',
  'JUJUBE & COFFEE': '대추와 커피',
  'KOREAN CABBAGE JEON': '배추전',
  'MAEK JEOK GAL BI': '맥적갈비',
  'MAESANGYI SOUP': '매생이 수프',
  'MINARI MUL-KIMCHI': '미나리 물김치',
  'MUSTARD GREENS WITH VEGETABLES': '겨자채',
  'MUNG BEAN PANCAKE': '녹두전과 즙장',
  'OKGWANG CHESTNUT': '옥광밤',
  'PETIT FOUR': '쁘띠푸르',
  'PINE MUSHROOM DUMPLINGS': '송이만두',
  SAMGYETANG: '삼계탕',
  'SMALL BITES': '작은 한입 요리',
  'SMALL SWEETS': '작은 디저트',
  'STEAMED ABALONE WITH SOY SAUCE': '능이전복탕',
  'TILEFISH, SQUASH, SAFFRON': '옥돔, 단호박, 사프란',
  'ABALONE & GIM': '전복과 김',
  'BURDOCK & WINTER FISH': '우엉과 겨울 생선',
  'HWANGTAE-GUK': '황태국',
  'QUAIL & CACAO': '메추라기와 카카오',
};

const CITY_TRANSLATIONS = {
  SEOUL: '서울',
};

function normalizeKey(value) {
  return `${value ?? ''}`
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

export function containsHangul(value) {
  return /[가-힣]/.test(`${value ?? ''}`);
}

export function localizeCity(value) {
  const normalized = normalizeKey(value);
  return CITY_TRANSLATIONS[normalized] ?? value ?? '서울';
}

export function localizeRestaurantName(value, slug = null) {
  if (slug && RESTAURANT_NAME_BY_SLUG[slug]) {
    return RESTAURANT_NAME_BY_SLUG[slug];
  }

  const normalized = normalizeKey(value);
  return RESTAURANT_NAME_TRANSLATIONS[normalized] ?? value ?? '레스토랑 미정';
}

export function localizeChefName(value) {
  if (!value) {
    return '셰프 미정';
  }

  if (containsHangul(value)) {
    return value;
  }

  const normalized = normalizeKey(value);
  return CHEF_NAME_TRANSLATIONS[normalized] ?? value;
}

export function localizeMenuTitle(value) {
  if (!value) {
    return '메뉴 미정';
  }

  if (containsHangul(value)) {
    return value;
  }

  const normalized = normalizeKey(value);
  return DISH_TITLE_TRANSLATIONS[normalized] ?? value;
}

export function localizeIngredientValues(values) {
  return (values ?? [])
    .map((value) => localizeMenuTitle(value))
    .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);
}

export function localizeSubtitle(title, subtitle) {
  const trimmedSubtitle = `${subtitle ?? ''}`.trim();

  if (!trimmedSubtitle) {
    return null;
  }

  if (containsHangul(trimmedSubtitle)) {
    return trimmedSubtitle;
  }

  const segments = trimmedSubtitle
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const hangulSegment = segments.find((segment) => containsHangul(segment));
  if (hangulSegment) {
    return hangulSegment;
  }

  const localized = localizeMenuTitle(trimmedSubtitle);
  if (containsHangul(localized) && localized !== title) {
    return localized;
  }

  return containsHangul(title) ? null : trimmedSubtitle;
}

export function buildRestaurantIntro(restaurantName) {
  return `${restaurantName} 큐레이션 메뉴 시드 데이터입니다.`;
}

export function buildChefBio(sourceLabel = '큐레이션 메뉴 데이터') {
  return `${sourceLabel}에서 가져온 셰프 프로필 placeholder입니다.`;
}
