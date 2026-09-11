// 정량화나 동의어 군집 없이, 검토된 표현과 해석 대기 원문을 구분한다.
export const detailDomains = ['taste', 'aroma', 'texture', 'mouthfeel', 'temperature', 'trigeminal', 'finish'];
export const positiveEvaluation = /좋(?:아요|았습니다|았어요|았다|았고|았는데|았지만|았음|다|고|지만|습니다)|마음에 들|만족|맛있/u;
export const negativeEvaluation = /싫(?:어요|었습니다|었어요|었다|었음|다|고|습니다)|아쉬(?:워요|웠습니다|웠어요|웠다|웠고|웠지만|웠음)|부담(?:스러|돼|되)|물렸|물려|별로|맛없|불쾌/u;
export const evaluationCue = /좋|싫|아쉽|아쉬|괜찮|만족|불만|훌륭|별로|선호|마음에|거슬|즐거|반갑|환상|매력|인상|취향|기대|실망|최고|최악|부담|물렸|물려|맛있|맛없/u;
export const comparativeOrConditional = /보다|비해|만큼|덜 .*좋|더 .*좋|(?:으면|라면|다면|했으면|할 때만|일 때만|때만)/u;
export const temporalDetail = /씹을수록|씹는 동안|삼킨\s?뒤|삼킨\s?후|식으니|식었을 때|식은 뒤|입안에 남는|입안을 덮|가볍게 부서|잘게 부서|퍼졌|퍼지|감싸|스며|피어|녹아|풀리|조이는/u;
export const additionalSenses = [
  ['texture.springy', /탄성/u],
  ['texture.crumbly', /(?:가볍게 |잘게 )?부서(?:지고|졌다|졌어요|졌습니다|지는)/u],
  ['texture.moist', /촉촉(?:했다|했습니다|했지만|했고)/u],
  ['texture.grainy', /알갱이(?:가|의)? 느껴|입자감/u],
  ['mouthfeel.dry', /입안(?:이|은) 마르|입안(?:이|은) 말랐/u],
];
export function sensoryDomain(text) {
  const patterns = [ ['aroma', /향(?:은|이|을|의|에|도|만|과|과는|$)|냄새/u], ['mouthfeel', /입안|구강|혀에 남|기름진 느낌/u], ['texture', /식감|질감|씹|부서|겉은|속은/u], ['temperature', /온도|차갑|따뜻|뜨거|식으니/u], ['trigeminal', /자극|얼얼|알싸|따끔/u], ['finish', /여운|뒷맛/u], ['taste', /맛(?:은|이|을|의|에|도|만|과|$)/u] ];
  return patterns.find(([,pattern])=>pattern.test(text))?.[0] ?? null;
}
export function shouldPreserveDetail(text) { return temporalDetail.test(text) || /(?:했다|했습니다)[.!?,;]?$/u.test(text); }
