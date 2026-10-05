// Editorial migration. Runtime generation still reads the single design JSON.
// Repeatable: archive each old definition once; never rewrite historical choices.
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const sourcePath = `${root}docs/product/tastebuddy-sensory-redesign-v2.json`;
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
assert.ok(['tastebuddy-sensory-redesign-v2-candidate-3','tastebuddy-sensory-redesign-v2-candidate-4'].includes(source.version), 'Review the newer source before applying this migration');
const revision = 'redesign-bubble-wording-4';
const wording = {
  sweet: `
basic|단맛|음식에서 단맛을 느꼈어요.
subtle|은은한 달콤함|단맛이 세지 않고 은은하게 받쳐줬어요.
clear|선명하게 달다|다른 맛과 구분될 만큼 단맛이 또렷했어요.
strong|진한 달콤함|단맛의 강도가 진하게 느껴졌어요.
honey-like|꿀의 달콤함|꿀을 떠올리게 하는 단맛이었어요. 꿀이 들어갔다는 뜻은 아니에요.
sugar-like|설탕처럼 달다|설탕을 맛볼 때의 단맛이 떠올랐어요.
syrup-like|시럽을 닮은 단맛|시럽 같은 단맛을 느꼈어요. 끈적한 질감을 고르는 말은 아니에요.
caramel-like|캐러멜 같은 단맛|캐러멜을 떠올리게 하는 단맛이었어요. 구운 향과는 따로 남겨요.
fruit-like|과일의 달큰함|과일에서 느끼는 듯한 달큰한 맛이었어요.
cooked-vegetable-like|익힌 채소의 달큰함|익힌 채소를 떠올리게 하는 단맛을 느꼈어요.
grain-like|곡물 같은 달큰함|곡물을 먹을 때의 단맛이 떠올랐어요.
milk-like|우유 같은 달콤함|우유에서 느끼는 듯한 단맛이었어요. 우유 향이나 질감과는 달라요.
seafood-like|해산물의 달큰함|해산물에서 느끼는 듯한 단맛이 떠올랐어요.
first-bite|첫입부터 달다|첫입에서 단맛을 느꼈어요. 이후에도 계속됐는지는 따로 남겨요.
while-chewing|씹는 동안 달콤한|씹는 동안 단맛이 느껴졌어요. 반드시 더 강해졌다는 뜻은 아니에요.
late-onset|뒤늦게 오는 달콤함|처음보다 뒤늦게 단맛이 느껴졌어요.
quick-fade|짧게 스친 단맛|단맛이 느껴졌다가 금방 사라졌어요.
lingering|달콤한 여운|단맛이 입안에 오래 남았어요.
malt-syrup-like|조청의 달큰함|조청을 떠올리게 하는 단맛이었어요. 실제 첨가 여부는 알 수 없어요.
dried-fruit-like|말린 과일의 단맛|말린 과일을 맛볼 때의 단맛이 떠올랐어요.
ripe-banana-like|익은 바나나처럼 달다|익은 바나나를 떠올리게 하는 단맛이었어요.
roasted-sweet-potato-like|군고구마의 달큰함|군고구마를 맛볼 때의 단맛이 떠올랐어요. 구운 향과는 구분해요.
chestnut-like|밤 같은 달큰함|밤을 먹을 때 느끼는 단맛이 떠올랐어요.
sweet-red-bean-like|단팥 같은 달콤함|단팥을 떠올리게 하는 단맛이었어요. 팥의 입자감은 별도예요.
corn-like|옥수수의 달큰함|옥수수를 맛볼 때의 단맛이 떠올랐어요.
fruit-juice-like|과즙처럼 달다|과즙을 떠올리게 하는 단맛이었어요. 수분이 많다는 뜻은 아니에요.
sauce|달콤한 소스|소스에서 단맛을 느꼈어요.
broth|달큰한 국물|국물에서 단맛을 느꼈어요.
filling|속재료가 달다|속재료에서 단맛을 느꼈어요.
surface|겉면이 달콤한|음식의 겉면에서 단맛을 느꼈어요.
first-sip|첫 모금의 달콤함|첫 모금에서 단맛을 느꼈어요.
after-swallow|삼킨 뒤에도 달다|삼킨 뒤에도 단맛이 느껴졌어요. 오래 지속됐는지는 따로 남겨요.`,
  sour: `
basic|신맛|음식에서 신맛을 느꼈어요.
subtle|살짝 새큼한|산미가 강하지 않고 은은하게 느껴졌어요.
clear|선명한 산미|다른 맛과 구분될 만큼 산미가 또렷했어요.
strong|강하게 시다|신맛의 강도가 높게 느껴졌어요.
sharp|날 선 산미|산미가 날카롭게 느껴졌어요. 매운 자극이나 떫은 느낌과는 구분해요.
lemon-like|레몬 같은 새콤함|레몬을 떠올리게 하는 산미였어요. 레몬 향을 선택하는 말은 아니에요.
yuzu-like|유자 닮은 산미|유자를 맛볼 때의 산미가 떠올랐어요.
green-apple-like|풋사과처럼 새큼한|풋사과를 떠올리게 하는 산미였어요.
unripe-fruit-like|설익은 과일의 새콤함|덜 익은 과일에서 느끼는 듯한 산미였어요.
vinegar-like|식초처럼 시다|식초를 떠올리게 하는 신맛이었어요. 실제 식초 첨가를 뜻하지 않아요.
yogurt-like|요거트의 새큼함|요거트를 떠올리게 하는 산미였어요. 질감이나 유제품 향은 별도예요.
kimchi-like|익은 김치의 시큼함|익은 김치를 맛볼 때의 신맛이 떠올랐어요.
tomato-like|토마토 같은 산미|토마토를 떠올리게 하는 산미였어요.
first-bite|첫입이 새콤한|첫입에서 신맛을 느꼈어요.
while-chewing|씹을 때 느낀 산미|씹는 동안 산미가 느껴졌어요. 강도가 증가했다는 뜻은 아니에요.
late-onset|뒤늦게 새큼한|처음보다 뒤늦게 신맛이 느껴졌어요.
quick-fade|짧게 스친 산미|산미가 느껴졌다가 금방 사라졌어요.
lingering|새콤한 여운|신맛이 입안에 오래 남았어요.
lime-like|라임처럼 새콤한|라임을 맛볼 때의 산미가 떠올랐어요.
berry-like|베리의 새큼함|베리류를 떠올리게 하는 산미였어요.
plum-like|자두 닮은 새콤함|자두를 맛볼 때의 산미가 떠올랐어요.
maesil-like|매실 같은 산미|매실을 떠올리게 하는 산미였어요. 매실청의 단맛과는 구분해요.
sour-cream-like|사워크림의 새큼함|사워크림 같은 산미였어요. 크림의 질감은 별도로 남겨요.
pickle-like|피클처럼 시큼한|피클을 맛볼 때의 신맛이 떠올랐어요.
sauce|새콤한 소스|소스에서 신맛을 느꼈어요.
broth|국물이 시큼한|국물에서 신맛을 느꼈어요.
filling|속재료의 새콤함|속재료에서 신맛을 느꼈어요.
surface|겉에서 느낀 산미|음식의 겉면에서 산미를 느꼈어요.
first-sip|첫 모금이 새큼한|첫 모금에서 신맛을 느꼈어요.
after-swallow|삼킨 뒤에도 새콤한|삼킨 뒤 신맛이 느껴졌어요. 긴 지속을 뜻하는 것은 아니에요.`,
  salty: `
basic|짠맛|음식에서 짠맛을 느꼈어요.
subtle|부드러운 간|짠맛이 세게 튀지 않고 은은하게 받쳐줬어요.
clear|간이 또렷함|짠맛의 존재가 분명하게 느껴졌어요. 알맞다는 평가와는 달라요.
strong|간이 강함|짠맛의 강도가 높게 느껴졌어요. 과하거나 싫었다는 뜻은 아니에요.
salt-like|소금 같은 간|소금을 맛볼 때의 짠맛이 떠올랐어요.
soy-sauce-like|간장의 짭짤함|간장을 떠올리게 하는 짠맛이었어요. 실제 간장 첨가를 뜻하지 않아요.
cheese-like|치즈처럼 짭짤한|치즈를 맛볼 때의 짠맛이 떠올랐어요.
fermented-seafood-like|젓갈 같은 간|젓갈을 떠올리게 하는 짠맛이었어요. 발효 향은 따로 남겨요.
broth|국물의 간|국물에서 짠맛을 느꼈어요.
sauce|짭짤한 소스|소스에서 짠맛을 느꼈어요.
surface|겉면의 짭짤함|음식의 겉면에서 짠맛을 느꼈어요.
inside|속까지 밴 간|음식의 속에서도 짠맛이 느껴졌어요. 실제 간을 한 과정은 알 수 없어요.
first-bite|첫입에 느낀 간|첫입에서 짠맛을 느꼈어요.
late-onset|뒤늦게 오는 짠기|처음보다 뒤늦게 짠맛이 느껴졌어요.
quick-fade|금세 가시는 짠기|짠맛이 느껴졌다가 금방 사라졌어요.
lingering|짭짤한 여운|짠맛이 입안에 오래 남았어요.
doenjang-like|된장의 짠기|된장을 떠올리게 하는 짠맛이었어요. 장향이나 감칠맛과는 따로 남겨요.
brine-like|소금물 같은 짠기|소금물을 맛볼 때의 짠맛이 떠올랐어요.
olive-like|올리브의 짭짤함|올리브를 떠올리게 하는 짠맛이었어요. 올리브의 쓴맛은 별도예요.
cured-ham-like|햄처럼 짭짤한|햄을 맛볼 때의 짠맛이 떠올랐어요.
coating|튀김옷의 간|튀김옷에서 짠맛을 느꼈어요.
noodles|면에 밴 간|면에서 짠맛을 느꼈어요.
filling|짭짤한 속재료|속재료에서 짠맛을 느꼈어요.
skin|껍질 쪽의 짠기|껍질에서 짠맛을 느꼈어요.
after-swallow|삼킨 뒤에도 짭짤한|삼킨 뒤 짠맛이 느껴졌어요. 오래 지속됐는지는 따로 남겨요.
while-chewing|씹을 때 배어나는 간|씹는 동안 짠맛을 느꼈어요. 반드시 더 강해졌다는 뜻은 아니에요.`,
  bitter: `
basic|쓴맛|음식에서 쓴맛을 느꼈어요.
subtle|은은한 쌉쌀함|쓴맛이 세지 않고 은은하게 느껴졌어요.
mild-bitter-ko|쌉싸름함|쌉싸름하다고 표현할 만한 맛을 느꼈어요. 강도나 호감은 따로 남겨요.
strong|진하게 쓰다|쓴맛의 강도가 높게 느껴졌어요.
leaf-like|잎채소의 쌉싸름함|잎채소를 떠올리게 하는 쓴맛이었어요. 풀 향이나 잎의 식감과는 달라요.
cacao-like|카카오 쌉쌀함|카카오를 맛볼 때의 쓴맛이 떠올랐어요.
coffee-like|커피처럼 쌉쌀한|커피를 떠올리게 하는 쓴맛이었어요. 볶은 향은 별도로 남겨요.
tea-like|차의 씁쓸함|차를 맛볼 때의 쓴맛이 떠올랐어요. 입안이 마르는 떫음과는 구분해요.
citrus-peel-like|감귤 껍질의 쓴 기운|감귤 껍질을 떠올리게 하는 쓴맛이었어요. 실제 껍질이 들어갔다는 뜻은 아니에요.
first-bite|첫입이 쓰다|첫입에서 쓴맛을 느꼈어요.
while-chewing|씹을 때 쌉쌀한|씹는 동안 쓴맛이 느껴졌어요. 강도가 증가했다는 뜻은 아니에요.
late-onset|뒤늦은 쓴 기운|처음보다 뒤늦게 쓴맛이 느껴졌어요.
quick-fade|짧게 스친 씁쓸함|쓴맛이 느껴졌다가 금방 사라졌어요.
lingering|쌉싸름한 여운|쓴맛이 입안에 오래 남았어요.
grapefruit-like|자몽의 씁쓸함|자몽을 맛볼 때의 쓴맛이 떠올랐어요. 자몽의 산미와는 별도예요.
bitter-melon-like|여주처럼 쓰다|여주를 떠올리게 하는 쓴맛이었어요.
doraji-like|도라지 쌉싸름함|도라지를 맛볼 때의 쓴맛이 떠올랐어요.
sseumbagwi-like|씀바귀 같은 씁쓸함|씀바귀를 떠올리게 하는 쓴맛이었어요.
olive-like|올리브의 쓴 기운|올리브를 맛볼 때의 쓴맛이 떠올랐어요. 짠맛은 별도로 남겨요.
beer-like|맥주처럼 쌉쌀한|맥주를 떠올리게 하는 쓴맛이었어요. 탄산이나 알코올 자극과는 구분해요.
surface|겉면이 쌉쌀한|음식의 겉면에서 쓴맛을 느꼈어요. 탄 향을 느꼈다는 뜻은 아니에요.
skin|껍질의 씁쓸함|껍질에서 쓴맛을 느꼈어요.
first-sip|첫 모금의 쌉쌀함|첫 모금에서 쓴맛을 느꼈어요.
after-swallow|삼킨 뒤의 씁쓸함|삼킨 뒤 쓴맛이 느껴졌어요. 오래 지속됐는지는 따로 남겨요.`,
  umami: `
basic|감칠맛|음식에서 감칠맛을 느꼈어요.
subtle|은근한 깊이|감칠맛이 강하지 않고 은은하게 배경을 채웠어요.
clear|감칠맛이 또렷함|다른 맛과 구분될 만큼 감칠맛이 또렷했어요.
strong|진한 감칠맛|감칠맛의 강도가 진하게 느껴졌어요.
meat-broth-like|고기 육수 같은 깊이|고기 육수를 떠올리게 하는 감칠맛이었어요. 육향이나 실제 재료와는 별도예요.
vegetable-broth-like|채소 육수의 깊이|채소 육수를 맛볼 때의 감칠맛이 떠올랐어요.
clam-broth-like|조개 국물 같은 감칠맛|조개 국물을 떠올리게 하는 감칠맛이었어요.
anchovy-broth-like|멸치 육수의 감칠맛|멸치 육수를 맛볼 때의 감칠맛이 떠올랐어요.
kelp-like|다시마 같은 깊이|다시마를 떠올리게 하는 감칠맛이었어요.
mushroom-like|버섯에서 느끼는 깊이|버섯을 먹을 때의 감칠맛이 떠올랐어요. 버섯 향과는 따로 남겨요.
tomato-like|토마토의 감칠맛|토마토를 떠올리게 하는 감칠맛이었어요. 산미나 실제 재료를 뜻하지 않아요.
jang-like|장류의 깊은 맛|장류를 맛볼 때의 감칠맛이 떠올랐어요. 짠맛이나 발효 향과는 달라요.
aged-cheese-like|숙성 치즈 같은 깊이|숙성 치즈를 떠올리게 하는 감칠맛이었어요.
first-bite|첫입에 오는 감칠맛|첫입에서 감칠맛을 느꼈어요.
while-chewing|씹을 때 우러나는 맛|씹는 동안 감칠맛이 느껴졌어요. 반드시 더 강해졌다는 뜻은 아니에요.
late-onset|뒤늦게 오는 깊이|처음보다 뒤늦게 감칠맛이 느껴졌어요.
quick-fade|짧게 끊긴 감칠맛|감칠맛이 느껴졌다가 금방 사라졌어요.
lingering|길게 이어지는 감칠맛|감칠맛이 입안에 오래 남았어요.
shrimp-like|새우 같은 감칠맛|새우를 맛볼 때의 감칠맛이 떠올랐어요.
crab-like|게살에서 느끼는 깊이|게를 떠올리게 하는 감칠맛이었어요. 게살의 질감은 별도예요.
bonito-flake-like|가쓰오부시의 깊은 맛|가쓰오부시를 떠올리게 하는 감칠맛이었어요. 훈연 향과는 구분해요.
dried-shiitake-like|말린 표고 같은 깊이|말린 표고를 맛볼 때의 감칠맛이 떠올랐어요.
doenjang-like|된장의 감칠맛|된장을 떠올리게 하는 감칠맛이었어요. 실제 된장 첨가를 뜻하지 않아요.
fish-sauce-like|액젓 같은 감칠맛|액젓을 맛볼 때의 감칠맛이 떠올랐어요. 짠맛과는 별도예요.
broth|국물에서 오는 깊이|국물에서 감칠맛을 느꼈어요.
sauce|소스가 품은 감칠맛|소스에서 감칠맛을 느꼈어요.
filling|속재료의 깊은 맛|속재료에서 감칠맛을 느꼈어요.
flesh|속살의 감칠맛|속살에서 감칠맛을 느꼈어요.
first-sip|첫 모금의 깊이|첫 모금에서 감칠맛을 느꼈어요.
after-swallow|삼킨 뒤 남은 감칠맛|삼킨 뒤 감칠맛이 느껴졌어요. 긴 지속을 뜻하는 것은 아니에요.`,
  fat: `
basic|지방감|음식에서 기름지게 느껴지는 지방감을 남겨요. 영양성분의 지방량을 뜻하지 않아요.
subtle|가벼운 기름기|지방감이 강하지 않고 은은하게 느껴졌어요.
clear|또렷한 지방감|다른 인상과 구분될 만큼 지방감이 또렷했어요.
strong|풍성한 지방감|지방감이 진하게 느껴졌어요. 좋거나 싫다는 평가는 따로 남겨요.
meat-like|고기 지방의 풍성함|고기 지방을 떠올리게 하는 지방감이었어요. 실제 고기나 육향을 뜻하지 않아요.
fish-like|생선 같은 기름기|생선의 기름기를 떠올리게 하는 지방감이었어요.
butter-like|버터 같은 풍성함|버터를 떠올리게 하는 지방감이었어요. 버터 향이나 매끈한 질감은 별도예요.
oil-like|오일감|오일을 떠올리게 하는 지방감이었어요. 실제 오일 첨가를 뜻하지 않아요.
first-bite|첫입에 느낀 기름기|첫입에서 지방감을 느꼈어요.
late-onset|뒤늦게 오는 지방감|처음보다 뒤늦게 지방감이 느껴졌어요.
quick-fade|금세 가시는 기름기|지방감이 느껴졌다가 금방 사라졌어요.
lingering|기름진 여운|지방감이 입안에 오래 남았어요. 느끼해서 싫었다는 뜻은 아니에요.
broth|기름기 도는 국물|국물에서 지방감을 느꼈어요. 눈에 보이는 기름막을 기록하는 말은 아니에요.
sauce|소스의 오일감|소스에서 지방감을 느꼈어요.
inside|속에서 느낀 기름기|음식의 속에서 지방감을 느꼈어요.
skin|껍질 쪽의 기름기|껍질에서 지방감을 느꼈어요.
first-sip|첫 모금의 오일감|첫 모금에서 지방감을 느꼈어요.
while-chewing|씹을 때 느낀 기름기|씹는 동안 지방감이 느껴졌어요. 강도가 증가했다는 뜻은 아니에요.`
};
const rows = Object.entries(wording).flatMap(([axis, text]) => text.trim().split('\n').map(line => {
  const [key,label,description] = line.split('|');
  assert.ok(key && label && description && line.split('|').length === 3);
  return {id:`v2.bubble.${axis}.${key}`,label,description};
}));
assert.equal(rows.length, 160);
assert.equal(new Set(rows.map(r=>r.label)).size, 160);
assert.deepEqual(new Set(rows.map(r=>r.id)), new Set(source.bubble_nodes.map(n=>n.id)));
const byID = new Map(rows.map(row=>[row.id,row]));
const paths = ['docs/product/tastebuddy-sensory-redesign-v2.json','docs/product/tastebuddy-sensory-redesign-v2.md','scripts/build-sensory-v2.mjs','src/lib/sensoryV2.mjs','src/lib/sensoryV2.d.mts','src/constants/dining-sensory-v2.json','ios/TasteBuddy/Resources/TBA/dining-sensory-v2.json','android/app/src/main/assets/tba/dining-sensory-v2.json','ios/TasteBuddy/Domain/Models/DiningSensoryV2Catalog.swift','ios/TasteBuddy/Domain/UseCases/DiningSensoryV2Parser.swift','ios/TasteBuddy/Features/Dining/DiningView.swift','scripts/test-web-sensory-v2.mjs','ios/TasteBuddyTests/SensoryV2Tests.swift','scripts/build-sensory-v2-fixtures.mjs','scripts/fixtures/sensory-v2-parity.json'];
for (const path of paths) {
  const backup = `${root}output/qa/bubble-wording-20260928/backup/${path}`;
  if (!existsSync(backup) && existsSync(`${root}${path}`)) {
    mkdirSync(backup.slice(0,backup.lastIndexOf('/')), {recursive:true});
    writeFileSync(backup, readFileSync(`${root}${path}`));
  }
}
const oldNodes = structuredClone(source.bubble_nodes);
source.bubble_definition_archive ??= [];
for (const node of source.bubble_nodes) {
  if (node.definition_version !== revision && !source.bubble_definition_archive.some(n=>n.id===node.id && n.definition_version===node.definition_version)) source.bubble_definition_archive.push(structuredClone(node));
  const row=byID.get(node.id);
  node.search_aliases=[...new Set([...(node.search_aliases??[]),...(node.definition_version!==revision?[node.label]:[])])].filter(label=>label!==row.label);
  node.label=row.label;
  node.description=row.description;
  node.definition=`${row.description} 이 표현은 ${source.axes.find(a=>a.id===node.axis).label} 축의 사용자 인상이다. 명시하지 않은 강도·호감·실제 재료·조리법·향·식감으로 확대하지 않는다.`;
  node.definition_version=revision;
  node.wording_style='natural_impression_with_explanation';
}
source.version='tastebuddy-sensory-redesign-v2-candidate-4';
source.definition_version=revision;
source.bubble_wording_revision={date:'2026-09-28', status:'implemented_editorial_candidates_not_user_validated', rules:[
  '6축은 내부 분류와 탐색 방향이다. 모든 라벨에 축 이름을 접미어로 붙이지 않는다.',
  '직접 감각어·짧은 인상·간/깊이/여운·필요한 미각 명칭을 섞되 말끝만 자동 치환하지 않는다.',
  '라벨과 사용자용 설명을 함께 제시한다. 내부 의미 정의를 사용자 설명으로 대신하지 않는다.',
  '향·식감·온도·자극은 디테일에 둔다. 단맛의 비유와 실제 재료를 구분한다.',
  '160개 ID·6축 순서·고정 앵커 위치·음식별 교환 규칙·147개 디테일은 유지한다.',
  '이전 정의는 archive에 보존한다. 새 라벨을 과거 기록에 소급 적용하지 않는다.'
]};
writeFileSync(sourcePath,JSON.stringify(source,null,2)+'\n');
const mdPath=`${root}docs/product/tastebuddy-sensory-redesign-v2.md`;
let md=readFileSync(mdPath,'utf8');
md=md.replace('상태: **구현 전 설계안 · 어휘·프로필 모두 사용자 검증 전 후보**','상태: **자연어 라벨·설명 코드 반영 · 어휘·프로필 사용자 검증 전 후보**');
md=md.replace(/개정: 버블 후보 160개 유지[^\n]*/, '개정: 2026-09-28 · 버블 160개 자연어 라벨·설명 개정 · 디테일 147개 유지 · 카탈로그 `candidate-4`');
md=md.replace('이번 범위: 실제 소스·계약 확인, 어휘·배치·카테고리·선택 의미·마이그레이션 설계. **앱 소스 변경, 빌드, 실기기·렌더링 검증은 하지 않았다.**','이번 개정: 공용 어휘 원본과 생성기, 네이티브·웹의 설명 표시 및 과거 정의 복원 경로를 수정한다. 검증 결과는 `docs/qa/bubble-wording-20260928.md`에 별도로 기록한다. 사용자 이해도 검증은 아직 수행하지 않았다.');
md=md.replace('## 1. 확인한 현재 구현과 변경 지점','## 1. 최초 설계 당시 확인한 구현과 변경 지점');
// Update examples outside historical tables, leaving axis names themselves intact.
for(const node of oldNodes.filter(n=>!n.fixed_anchor).sort((a,b)=>b.label.length-a.label.length)) {
  if (node.label!==byID.get(node.id).label) md=md.split(node.label).join(byID.get(node.id).label);
}
md=md.replace('이 값의 실행 파서 지원은 구현 시 별도 정의한다.', '이 값의 실행 파서 지원은 공용 생성기와 iOS/웹 일치 테스트에서 관리한다.');
md=md.replace('이번 디테일 개정의 카탈로그는 `candidate-3`이다. 버블 항목은 각자의 기존 `definition_version`을 보존한다.', '디테일 개정은 `candidate-3`, 이번 버블 문구 개정은 `candidate-4`다. 버블은 `redesign-bubble-wording-4`를 사용하고 이전 정의는 `bubble_definition_archive`에 보존한다.');
md=md.replace('기존 96개 ID·정의·축별 기본 순번은 유지하고', '기존 96개 ID·축별 기본 순번은 유지하고');
md=md.replace('JSON의 `app.fat_impression`은 실행 엔진에 이미 등록된 이름이 아니라 제안된 구분값이다.', 'JSON의 `app.fat_impression`은 실행 카탈로그에서 앱의 지방감 인상을 별도로 보존하는 속성이다. 객관적인 지방 함량이나 다른 감각으로 환산하지 않는다.');
if(!md.includes('### 3.1 자연어 라벨과 설명')) {
  const insert=`### 3.1 자연어 라벨과 설명 — 2026-09-28 개정\n\n6축은 분류 기준이지 모든 문구의 말끝이 아니다. 예를 들어 쓴맛 축에는 ‘은은한 쌉쌀함·첫입이 쓰다·뒤늦은 쓴 기운·쌉싸름한 여운’, 짠맛 축에는 ‘부드러운 간·간이 또렷함·속까지 밴 간’, 감칠맛 축에는 ‘은근한 깊이·국물에서 오는 깊이·짧게 끊긴 감칠맛’을 둔다. ‘캐러멜 같은 단맛’처럼 의미 구분에 필요한 미각 명칭은 남긴다.\n\n\`label\`은 버블의 짧은 표현, \`description\`은 사용자가 읽는 설명, \`definition\`은 해석 경계를 포함한 내부 정의다. \`search_aliases\`는 이전 용어로도 찾을 수 있게 하되 이전 라벨을 새 응답으로 자동 치환하는 용도가 아니다. 이름만 바꾸어 강도·재료·호감을 새로 추정하지 않는다. 향·식감은 여전히 디테일 태그다.\n\n기존 데이터 규모(160/147), 각 축의 순번·고정 자리, 음식 프로필의 참조 ID는 변경하지 않는다. 기존 버블 정의는 읽기 전용 archive로 보존하고, 기록의 ID+카탈로그 버전+정의 버전으로 당시 라벨과 의미를 복원한다. 알 수 없는 버전이나 일치하지 않는 라벨은 미확정으로 남긴다.\n\n`;
  md=md.replace('## 4. 버블 배치와 상호작용',insert+'## 4. 버블 배치와 상호작용');
}
// Keep the existing appendix IDs and definitions, and publish a compact wording review sheet.
writeFileSync(mdPath,md);
const sheet=['# Taste Buddy 버블 문구 개정 — 2026-09-28','','상태: candidate-4 · 일반 사용자 이해도 검증 전. 버블 160개와 디테일 147개 유지.','', '내부 축·ID·배치 순서는 유지하고, 라벨·사용자 설명·정의 버전을 개정한다. 향·식감·온도·자극은 디테일 화면에서 선택한다. 이전 단어의 해석은 당시 정의와 라벨로 보존한다.',''];
for(const axis of source.axes){sheet.push(`## ${axis.label}`, '', '| 버블 문구 | 선택 시 읽는 설명 |', '|---|---|');for(const n of source.bubble_nodes.filter(n=>n.axis===axis.id))sheet.push(`| ${n.label} | ${n.description} |`);sheet.push('');}
writeFileSync(`${root}docs/product/tastebuddy-bubble-wording-v4.md`,sheet.join('\n')+'\n');
console.log(JSON.stringify({version:source.version,bubbles:source.bubble_nodes.length,details:source.detail_nodes.length,archived:source.bubble_definition_archive.length,labelsChanged:oldNodes.filter(n=>n.label!==byID.get(n.id).label).length}));
