import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { LEXICON_VERSION, validateSemanticAtom } from './rules.mjs';
const atlasURL = new URL('../../docs/product/tba-bubble-atlas.json', import.meta.url);
const bytes = readFileSync(atlasURL);
const atlas = JSON.parse(bytes);
const definitions = new Map();
const add = (labels, attribute, options = {}) => {
  for (const label of labels.split('|')) {
    const atom = { kind:'sensory_presence',attribute,value:true,scale:'presence-v1' };
    const atoms = [atom];
    if (options.intensity) atoms.push({kind:'sensory_intensity',attribute,value:options.intensity,scale:'expression-strength-v1'});
    if (options.target) atoms.forEach(a => {a.target=options.target;});
    if (options.phase) atoms.forEach(a => {a.phase=options.phase;});
    definitions.set(label,{atoms,...options});
  }
};
// 직접 검토한 완전한 라벨만 연결한다. atlas domain/root/parent/pack은 의미 생성에 읽지 않는다.
add('달콤한|채소 같은 단맛|양파처럼 익힌 단맛|달달한 양념|물엿 같은 양념 단맛|구운 양념의 단맛|해산물의 단맛|곡물의 단맛|졸인 토마토 단맛|양파가 섞인 듯한 단맛|생채소의 단맛|당근 같은 단맛|익힌 채소 단맛|구운 양파 같은 단맛|익힌 당근 같은 단맛|크림의 단맛|과일의 단맛|잘 익은 과일 같은 단맛|즙에서 느껴지는 단맛|캐러멜 같은 단맛|구운 설탕 같은 단맛|우유를 떠올리는 단맛|차의 은은한 단맛|쌀술의 단맛|음료의 단맛|주스처럼 과즙 단맛|떡소의 단맛|팥소에서 오는 단맛|꿀 같은 소의 단맛|카레의 익힌 단맛|볶은 양파 같은 카레 단맛|잘 익은 채소 같은 카레 단맛','taste.sweet');
add('은은한 단맛|무처럼 은은한 단맛|은은한 우유 단맛','taste.sweet',{intensity:'weak'});
add('흑설탕처럼 진한 단맛|연유처럼 짙은 단맛|시럽처럼 진한 단맛','taste.sweet',{intensity:'strong'});
add('씹을수록 단맛|오래 씹으면 달아지는|양배추처럼 씹을수록 단맛|씹을수록 단 새우살','taste.sweet',{phase:'during_meal'});
add('삼킨 뒤 단 조개살|삼킨 뒤 남는 쌀 단맛|삼킨 뒤 올라오는 단맛|삼킨 뒤 단맛이 남는','taste.sweet',{phase:'after_swallow'});
add('첫입에 오는 토마토 단맛|입에 넣을 때 달콤한','taste.sweet',{phase:'first_bite'});
add('끝에 살짝 단맛','taste.sweet',{intensity:'weak',partial:'끝맛의 위치는 표현되지만 식사 후반·삼킨 뒤 중 어느 시점인지는 확정할 수 없다.'});
add('끝에 남는 크림 단맛|입안에 가볍게 남는 단맛','taste.sweet',{partial:'남는 감각의 구체 시점·길이는 명시되지 않았다.'});
add('새콤한|또렷한 산미|익은 김치의 신맛|끓이며 부드러워진 신맛|새콤한 비빔 양념|과일처럼 둥근 신맛|토마토의 산미|신선한 토마토 같은 산미|익힌 토마토 같은 산미|발효에서 느끼는 신맛|익은 김치 같은 신맛|과일의 새콤함|요거트 같은 산미|부드럽게 오는 요거트 산미|감귤류 같은 산미|레몬처럼 또렷한 산미|커피의 산미|과일처럼 새콤한 커피|혀에 날카롭게 오는 커피 산미|와인의 산미|침이 고이는 듯한 산미|쌀술의 새콤함|요거트처럼 부드러운 산미|음료의 신맛|식초 같은 신맛|혀에 날카롭게 오는 신맛','taste.sour');
add('첫입에 오는 산미|첫입부터 시큼한 국물|첫입이 새콤한 과육|한 모금부터 새콤한','taste.sour',{phase:'first_bite'});
add('삼킨 뒤 남는 산미|삼킨 뒤 새콤한 과즙|삼킨 뒤 길게 남는 산미','taste.sour',{phase:'after_swallow'});
add('짭짤한|또렷한 짠맛|발효 양념의 짠맛|간장 같은 짠맛|젓갈 같은 짠맛|치즈의 짠맛|녹은 치즈에서 남는 짠맛','taste.salty');
add('짭짤한 소스','taste.salty',{target:'sauce'});
add('겉면에 몰린 짠맛','taste.salty',{target:'surface'});
add('속까지 밴 짠맛|속살까지 짭짤한','taste.salty',{target:'inside'});
add('껍질 쪽이 짭짤한','taste.salty',{target:'skin'});
add('첫입의 짠맛|첫입에 짭짤한 치즈','taste.salty',{phase:'first_bite'});
add('끝에 남는 짠맛','taste.salty',{partial:'끝맛이 식사 후반인지 삼킨 뒤인지 명시되지 않았다.'});
add('쌉싸름한|또렷한 쓴맛|혀에 남는 쓴맛|잎채소의 쓴맛|초콜릿의 쓴맛|견과 껍질의 쓴맛|속껍질이 쌉싸름한|커피의 쓴맛|차의 쓴맛|맥주의 쌉쌀함|혀에 짧게 오는 쓴맛|카카오 같은 쌉쌀함|카카오를 닮은 짧은 쓴맛|카카오를 닮은 긴 쓴맛','taste.bitter');
add('카카오처럼 진한 쓴맛','taste.bitter',{intensity:'strong'});
add('첫 모금이 쓴 커피|첫 모금에 쌉싸름한 차','taste.bitter',{phase:'first_bite'});
add('삼킨 뒤 쓴맛|삼킨 뒤 더 쓴 커피|삼킨 뒤 오래 쌉쌀한','taste.bitter',{phase:'after_swallow',partial:'더·오래 같은 상대 강도나 지속 시간은 숫자로 변환하지 않는다.'});
add('끝에 쌉싸름한 잎맛|끝에 남는 초콜릿 쓴맛|씹은 뒤 남는 껍질 쓴맛|오래 남는 차의 쓴맛','taste.bitter',{partial:'상세 시점이나 지속 시간은 추가 정의가 필요하다.'});
add('감칠맛|고기 육수 같은 감칠맛|채소 육수 같은 감칠맛|고기의 감칠맛|숙성된 듯한 감칠맛|조개즙 같은 감칠맛|새우즙 같은 감칠맛|토마토의 감칠맛|만두 속 감칠맛|버섯 같은 감칠맛|발효 재료의 감칠맛','taste.umami');
add('진한 감칠맛|속살에 남는 진한 감칠맛','taste.umami',{intensity:'strong'});
add('씹을수록 감칠맛','taste.umami',{phase:'during_meal'});
add('길게 남는 감칠맛|씹은 뒤 짙어지는 감칠맛','taste.umami',{partial:'지속 시간·상대 변화의 기준이 없어 별도 수치나 단계로 변환하지 않는다.'});
add('기름진|느껴지는 기름기|고기 지방감|씹히는 비계의 기름기|생선의 기름기|회에서 느껴지는 지방|입안에서 녹는 회의 지방|혀에 남는 회의 기름기|튀김의 기름기|입술에 묻는 튀김 기름기|견과류의 기름기|씹을수록 배어나는 기름|혀에 얇게 남는 견과 기름기|유제품의 지방감|입안을 얇게 감싸는 유지방|버터처럼 두껍게 남는 지방감|소스에 섞인 오일|입안에 얇게 남는 오일|입안에 얇게 퍼지는 오일|카레의 오일감|표면에 얇게 뜬 오일','mouthfeel.fatty');
add('표면의 기름기','mouthfeel.fatty',{target:'surface'});
add('기름진 국물|국물 위 기름막|입안을 감싸는 국물 기름기','mouthfeel.fatty',{target:'broth'});
add('기름기가 적게 느껴지는 국물','mouthfeel.fatty',{target:'broth',intensity:'weak'});
add('튀김옷에 밴 기름기','mouthfeel.fatty',{target:'coating'});
add('껍질 아래 기름기|살 전체에 퍼진 기름기','mouthfeel.fatty',{target:'inside'});
add('입술에 남는 기름기','mouthfeel.fatty',{partial:'입술 위치는 음식 부위와 다르며 지속 시점은 미확정이다.'});
add('삼킨 뒤 남는 카레 기름기','mouthfeel.fatty',{phase:'after_swallow'});
add('바삭한|얇고 바삭한|얇게 파삭 부서지는|단단하게 바삭한|바삭함이 오래가는|식어도 바삭한|소스에 닿아도 바삭한|바삭한 생선껍질|가장자리가 바삭한 껍질|겹겹이 바삭한|바닥만 바삭한 만두|얇은 전분막이 바삭한','texture.crisp');
add('겉면이 바삭한|가장자리만 바삭한|표면 전체가 바삭한','texture.crisp',{target:'surface'});
add('튀김옷의 바삭함|얇은 튀김옷이 파삭한','texture.crisp',{target:'coating'});
add('아삭한|수분감 있는 아삭함|오이처럼 물기 있게 아삭한|무처럼 단단하게 아삭한|절임의 아삭함|사과처럼 아삭한 과육|큰 얼음이 아삭하게 씹히는','texture.crunchy');
add('쫄깃한|찰지게 쫄깃한|힘줄이 쫄깃하게 씹히는|쫄깃한 해산물살|오징어처럼 오래 씹히는|문어처럼 탄탄하게 씹히는|쫄깃한 만두피|두껍고 찰진 피|쫀득한 빵 속|씹을수록 찰진 빵|떡의 쫀득함|짧게 끊기는 찰진 떡','texture.chewy');
add('쫄깃한 면|씹을수록 찰진 면','texture.chewy',{target:'noodles'});
add('질긴 느낌|여러 번 씹어야 하는|씹어도 잘 끊기지 않는','texture.chewy',{partial:'씹힘 저항을 보존하며 쫄깃함의 호감으로 바꾸지 않는다.'});
add('탱글한|탄력 있는 식감|누르면 되돌아오는|씹으면 탱글하게 끊기는|씹으면 탱글하게 끊기는 회|탱글한 해산물살|새우처럼 톡 끊기는|조개처럼 탄력 있는|얇지만 탄력 있는 피','texture.springy');
add('부드러운|쉽게 으깨지는|혀로 누르면 으깨지는|씹기 전에 풀어지는|부드러운 해산물살|게살처럼 가늘게 풀리는|가리비처럼 쉽게 갈라지는|부드러운 만두피|쉽게 풀어지는 찐 피|두부처럼 부드러운|혀로 쉽게 부서지는 두부|속이 몽글하게 풀리는|무르게 익은 채소|결대로 으깨지는 채소|속까지 물러진 채소|무른 과육|잘 익어 부드러운 과육|쉽게 으깨지는 과육','texture.soft');
add('부드러운 면|힘없이 풀어지는 면|속까지 부드럽게 익은 면','texture.soft',{target:'noodles'});
add('매끈한|미끄러운 표면|혀에서 미끄러지는|입술에 매끈하게 닿는|크림처럼 매끈한|덩어리 없이 매끈한|매끈한 회 표면|미끄럽게 닿는 회 표면|매끈한 크림소스|매끈하게 갈린 소스|매끈한 디저트 크림|알갱이 없이 매끈한 크림|매끈한 얼음 질감|혀에서 매끈하게 녹는|유제품의 매끈함','texture.smooth');
add('매끈한 면 표면|후루룩 미끄러지는 면|입술에 매끈하게 닿는 면','texture.smooth',{target:'noodles'});
add('촉촉한|수분감 있는|씹으면 물기가 나오는|속까지 촉촉한|육즙이 나오는|씹을수록 배어나는 육즙|머금은 해산물 즙|깨물면 나오는 조개즙|속살에 남은 촉촉한 즙|튀김 속의 촉촉함|고기 속 육즙이 남은|채소 속 물기가 남은|만두 속 육즙|깨물면 터지는 육즙|속 재료에 배어 있는 육즙|두부의 수분감|깨물면 물기가 나오는 두부|안쪽에 촉촉함이 남는|생채소의 물기|씹자마자 물기가 터지는|씹은 뒤에도 물기 있는|익힌 채소의 즙|버섯에서 배어나는 즙|가지처럼 즙을 머금은|촉촉한 케이크|속까지 촉촉한 시트|과즙이 풍부한|깨물면 과즙이 터지는|씹을수록 과즙이 나오는|과육 속 수분|즙이 한꺼번에 터지는|과육에 촉촉하게 머문 즙','texture.juicy');
add('첫입에 터지는 육즙','texture.juicy',{phase:'first_bite'});
add('푸석한|속이 푸석한|수분이 적은 속살|시트가 푸석하게 끊기는|과육이 푸석하게 갈라지는','texture.dry');
add('첫입에 단단한|첫입에 단단한 회','texture.hard',{phase:'first_bite'});
add('두꺼운 튀김옷이 단단한|탄탄한 회 식감|단단한 면 중심|가운데 심이 느껴지는|겉보다 속이 단단한 면|속까지 단단한 절임|단단한 과육|설익은 듯 단단한 과육','texture.hard');
add('꾸덕한|되직한 질감|천천히 흐르는|숟가락에 두껍게 붙는|걸쭉한 국물|혀에 두껍게 닿는 국물|꾸덕한 크림소스|면에 두껍게 붙는 크림|천천히 퍼지는 크림소스|걸쭉한 토마토소스|되직한 드레싱|쌀술의 농도감|혀에 되직하게 닿는 막걸리|걸쭉한 과육이 느껴지는','texture.thick');
add('밥알의 찰기|밥알끼리 달라붙는|씹을수록 끈기가 나는|달라붙는 소스|입술에 끈적하게 남는|떡의 달라붙는 느낌|치아에 붙는 떡|입천장에 붙는 떡|이에 살짝 붙는 찰기','texture.sticky');
add('작은 알갱이가 씹히는|콩의 입자감|콩가루가 혀에 남는|껍질 입자가 씹히는|견과류 가루감|잘게 부순 견과가 씹히는|고운 견과 가루가 남는|쌀술의 입자감|고운 쌀가루가 남는|작은 침전물이 느껴지는|과일의 입자감','texture.grainy');
add('가루처럼 부서지는|씹으면 가루가 되는|입안에서 잘게 부서지는|포슬포슬한|작게 갈라지는 속살|가볍게 흩어지는 식감|부스러지는 시트|포슬한 떡|쌀가루가 포슬하게 풀리는','texture.crumbly');
add('떫은|차의 떫은 느낌|입안을 조이는|잇몸이 조이는 차|과일의 떫은 느낌|껍질 쪽이 떫은|과육까지 입을 조이는','mouthfeel.astringent');
add('혀에 붙는 느낌|국물의 남는 느낌|입안에 크림막이 남는|혀에 남는 튀김 기름막|입안을 감싸는 국물 기름기','mouthfeel.coating',{partial:'무엇이 얼마나 오래 남는지는 표현 범위를 넘어 채우지 않는다.'});
add('삼킨 뒤 남는 국물 막','mouthfeel.coating',{phase:'after_swallow'});
add('입안이 마르는 느낌|씹을수록 입이 마르는|혀가 마르는 차','mouthfeel.dry');
add('차가운|차갑게 녹는|천천히 녹으며 차가운|음료의 차가움|입안을 바로 식히는|목으로 넘어갈 때 차가운','temperature.cold');
add('혀에 닿자마자 차가운','temperature.cold',{partial:'접촉 시점은 명시됐지만 첫입 또는 식사 단계로 같게 취급하지 않는다.'});
add('알코올의 따뜻함|목으로 넘어갈 때 따뜻한|향신료의 따뜻함|혀에 천천히 오는 열감|목에 길게 남는 열감|목에 따뜻함이 남는','temperature.warm',{partial:'온도·화학 자극 기전은 구분할 근거가 없어 따뜻함 보고만 보존한다.'});
add('매콤한|얼큰한 국물|목으로 넘어갈 때 얼큰한|칼칼한 국물|매콤한 양념|혀끝이 매운 양념|입안 전체가 매운 양념|면의 매운 양념|고추의 매운맛|혀끝에서 시작하는 매운맛|입안에 오래 남는 매운맛','trigeminal.spicy');
add('삼킨 뒤 더 매운 면','trigeminal.spicy',{phase:'after_swallow',partial:'더 매운 정도의 기준은 미확정이다.'});
add('먹을수록 매워지는 국물|먹을수록 쌓이는 매운맛','trigeminal.spicy',{phase:'during_meal',partial:'시간 변화는 표현되지만 절대 강도는 미확정이다.'});
add('몇 입 뒤 더 매워지는','trigeminal.spicy',{phase:'late_meal',partial:'몇 입 뒤의 상대 변화이며 절대 강도는 미확정이다.'});
add('알싸한|마늘·생강의 알싸함|생마늘처럼 알싸한|생채소의 알싸함|무처럼 혀에 오는 알싸함|코로 오는 알싸함|후추 같은 자극|목에 걸리는 후추 자극|혀에 남는 후추 자극','trigeminal.pungent');
add('얼얼한 느낌|혀가 저릿하게 얼얼한|입술에 남는 얼얼함','trigeminal.numbing');
add('톡 쏘는|맥주의 탄산감|잔잔하게 퍼지는 탄산|굵게 터지는 탄산|탄산의 크기|잘게 따끔거리는 탄산|입안에서 크게 터지는 탄산|탄산의 지속','trigeminal.fizzy',{partial:'입자 크기·지속성은 표현 척도가 정의되지 않아 별도 수치로 만들지 않는다.'});
add('첫 모금만 톡 쏘는','trigeminal.fizzy',{phase:'first_bite'});
add('삼킨 뒤에도 톡 쏘는','trigeminal.fizzy',{phase:'after_swallow'});
add('불향|숯불향|표면에 밴 숯향|살짝 그을린 고기향|볶은 면의 불향|웍에서 볶은 듯한 향|그을린 면의 향|연기를 떠올리는 향|장작 연기를 닮은 향|숯 연기를 닮은 향','aroma.smoky');
add('씹을수록 올라오는 숯향','aroma.smoky',{phase:'during_meal'});
add('구운 향|구운 고기향|갈색 겉면의 구운 향|구운 생선향|껍질의 구운 향|살에서 올라오는 구운 향|튀김옷의 구운 향|빵가루가 볶아진 듯한 향|반죽이 노릇해진 향|누룽지향|누렇게 구워진 쌀향|살짝 탄 누룽지향|구운 채소향|갈색으로 익은 채소향|가장자리가 그을린 향|구운 빵향|빵 껍질의 노릇한 향|커피의 볶은 향|볶은 차향|검게 구운 곡물향|토스트 같은 향|살짝 구운 빵을 닮은 향|볶은 곡물 같은 향|볶은 보리를 닮은 향|누룽지를 닮은 향|구운 떡향|겉면의 노릇한 쌀향|가장자리의 누룽지 같은 향','aroma.roasted');
add('토스트처럼 진한 구운 향|진하게 구운 빵을 닮은 향|진하게 볶은 원두향','aroma.roasted',{intensity:'strong'});
add('과일향','aroma.fruity');add('꽃향','aroma.floral');
add('은은한 꽃향|코에 살짝 스치는 꽃향','aroma.floral',{intensity:'weak'});
add('삼킨 뒤 남는 꽃향','aroma.floral',{phase:'after_swallow'});
add('풀·허브향|소스의 허브향|생채소의 풀향|잎채소의 풋향|줄기에서 올라오는 풀향|드레싱의 허브향','aroma.herbal');
add('바다향|생해산물향|굴 같은 바다향|해조류 같은 바다향','aroma.marine');
add('발효향|장류의 발효향|된장 같은 발효향|발효한 빵향|누룩 같은 발효향|효모를 떠올리는 향|빵 반죽을 닮은 발효향|유산 발효 같은 향|요거트를 닮은 발효향|익은 사과를 닮은 발효향','aroma.fermented');
add('청국장 같은 진한 발효향|코에 강하게 오는 발효향','aroma.fermented',{intensity:'strong'});
add('삼킨 뒤 남는 발효향','aroma.fermented',{phase:'after_swallow'});
add('우유·버터향|빵의 버터향|따뜻할 때 올라오는 버터향|씹은 뒤 남는 버터향|우유 같은 향|따뜻한 우유향|연유 같은 우유향|버터 같은 향|녹인 버터향|갈색으로 구운 버터향|우유 같은 크림향|버터가 섞인 크림향','aroma.dairy');
add('볶은 견과류향|갓 볶은 땅콩향|노릇하게 볶은 깨향','aroma.nutty');
add('짧은 끝맛|금방 사라지는 맛|오래가는 향|커피의 여운','finish.duration',{partial:'남음 또는 지속성은 표현되지만 수치·시점·구체 감각은 미확정이다.'});
add('여운이 남는','finish.duration',{partial:'남는 감각의 구체 종류·길이·시점은 명시되지 않았다.'});
add('코에 남는 향|코에 오래 남는 비린 향|향만 가볍게 남는 차','aroma.unspecified',{partial:'향의 종류 또는 지속 시간의 척도가 충분히 명시되지 않았다.'});
add('삼킨 뒤 올라오는 향','aroma.unspecified',{phase:'after_swallow',partial:'향의 구체적인 종류는 명시되지 않았다.'});
add('촉촉한|수분감 있는|속까지 촉촉한|속살에 남은 촉촉한 즙|튀김 속의 촉촉함|고기 속 육즙이 남은|채소 속 물기가 남은|속 재료에 배어 있는 육즙|두부의 수분감|안쪽에 촉촉함이 남는|생채소의 물기|씹은 뒤에도 물기 있는|촉촉한 케이크|속까지 촉촉한 시트|과육 속 수분|과육에 촉촉하게 머문 즙','texture.moist');
add('톡 쏘는','trigeminal.tingling',{partial:'톡 쏘는 자극은 보고됐지만 탄산 또는 산·향신료 등 원인은 명시되지 않았다.'});
add('첫 모금만 톡 쏘는','trigeminal.tingling',{phase:'first_bite',partial:'자극의 원인은 명시되지 않았다.'});
add('삼킨 뒤에도 톡 쏘는','trigeminal.tingling',{phase:'after_swallow',partial:'자극의 원인은 명시되지 않았다.'});
// 비유 향의 완전 일치 문법: 지정된 명사와 관계 표현만 허용하고 실제 재료로 만들지 않는다.
const referenceNouns = '감귤류|레몬|오렌지|베리|딸기|블루베리|사과·배|풋사과|익은 배|열대과일|망고|파인애플|복숭아·살구|복숭아|살구|말린 과일|건포도|말린 무화과|허브|바질|로즈메리|민트|고수|깻잎|꽃|자스민|장미|풀·잎|갓 자른 풀|말린 잎|계피|정향|카카오|코코아 가루|견과류|아몬드|땅콩|헤이즐넛|호두|나무|가죽|버섯|효모|맥주 효모|연기|캐러멜|녹인 설탕|갈색 설탕|새콤한 우유|익은 과일|푹 익은 바나나';
const metaphor = new RegExp(`^(?:${referenceNouns})(?: 같은|를 닮은|을 닮은|를 떠올리는|을 떠올리는|의) 향$`,'u');
const entries = atlas.nodes.map(node => {
  let definition = definitions.get(node.label);
  if (!definition && metaphor.test(node.label)) definition = {atoms:[{kind:'sensory_presence',attribute:'aroma.reference',value:true,scale:'presence-v1',reference:node.label}]};
  const atoms = definition?.atoms ?? [];
  if (definition && /(?: 같은|처럼|를 닮은|을 닮은|를 떠올리는|을 떠올리는) /u.test(node.label)) atoms.filter(a=>a.attribute.startsWith('aroma.')).forEach(a=>{a.reference=node.label;});
  const resolution = !definition ? 'unresolved' : definition.partial ? 'partial' : 'resolved';
  const reason = definition?.partial ?? (definition ? '완전 일치 라벨의 명시적 감각만 검토해 보존했다. 미언급 강도·호감·적정 수준은 추론하지 않는다.' : '이 라벨의 세부 의미 또는 관계를 아직 검토 규칙으로 확정하지 않았다. 원문을 보존하며 탐색 부모·분류에서 의미를 복사하지 않는다.');
  if (['고소한','깔끔한','담백한','구수한','시원한'].includes(node.label) && atoms.length) throw new Error(`AMBIGUOUS_LABEL_RESOLVED: ${node.label}`);
  for (const atom of atoms) { const verdict=validateSemanticAtom({...atom,target:atom.target??'whole_dish',phase:atom.phase??'unspecified'});if(!verdict.valid)throw new Error(`${node.label}: ${verdict.errors.join(',')}`); }
  return {id:node.id,label:node.label,locale:'ko-KR',resolution,reason,semanticAtoms:atoms,
    dimensions:{sensory:atoms.filter(a=>a.kind==='sensory_presence').map(a=>a.attribute),intensity:definition?.intensity??null,liking:null,preferenceFit:null,target:definition?.target??null,phase:definition?.phase??null},
    unresolvedFields:resolution==='resolved'?[]:[!definition?'meaning':'detail_scope'],
    prohibitedInferences:['ingredient_presence','user_liking_from_sensation','parent_or_neighbor_observation','numeric_intensity','meal_phase_from_recorded_at'],
    reviewStatus:definition?'reviewed_literal_expression':'unresolved_review_required'};
});
if(entries.length!==845 || new Set(entries.map(e=>e.id)).size!==845)throw new Error('ATLAS_ID_COUNT_CHANGED');
const document={schemaVersion:LEXICON_VERSION,status:'pilot_reviewed_subset_with_unresolved_entries',source:{path:'docs/product/tba-bubble-atlas.json',hash:createHash('sha256').update(bytes).digest('hex'),schemaVersion:atlas.schema_version},offsetUnit:'javascript_utf16_code_units',policy:{hierarchyIsNotEvidence:true,unselectedIsNotAbsent:true,metaphorIsNotIngredient:true,missingIsNotZero:true},entries,summary:Object.fromEntries(['resolved','partial','unresolved'].map(state=>[state,entries.filter(e=>e.resolution===state).length]))};
const target=new URL('./semantic-lexicon.json',import.meta.url);
if(process.argv.includes('--check')) {if(readFileSync(target,'utf8')!==JSON.stringify(document,null,2)+'\n')throw new Error('LEXICON_REGENERATION_DIFF');console.log(JSON.stringify(document.summary));}
else {writeFileSync(target,JSON.stringify(document,null,2)+'\n');console.log(fileURLToPath(target),JSON.stringify(document.summary));}
