# 전체 5단계 평가 독립 개발 검사

사용자 예시와 사전 공유 계약만으로 작성했다. 새 전체 평가 생산 구현·실행 결과를 읽기 전에 아래 표를 동결하며, 실행 실패를 없애기 위해 기대 의미를 바꾸지 않는다. 비공개 holdout이나 실제 사용자 정확도 측정이 아니다.

- 버전: `overall-evaluation-review/1`
- 표 SHA-256: `03078481ee94bce496d0e9c9d42861420b94c4511d238b0ab4d3453456e80c67`

| ID | 입력 상황 | 고정 기대 및 금지 |
| --- | --- | --- |
| OE-01 | 같은 산미 disliked 선택, 식사 A 전체 liked, 식사 B 전체 veryDisliked | 감각 관찰·산미 불호 값과 강도는 동일하다. 전체 값만 positive 대 very_negative로 다르며 B의 산미 불호를 강화하지 않는다. |
| OE-02 | 각각 전체 veryLiked/liked/neutral/disliked/veryDisliked만 입력 | overall_liking 5개 원값 very_positive/positive/neutral/negative/very_negative를 그대로 보존한다. 개별 감각 호감과 메인·윙은 만들지 않는다. |
| OE-03 | 전체 평가 nil과 neutral 비교 | nil은 미응답, neutral은 명시적인 중립이다. nil에서 중립 원자를 생성하지 않는다. |
| OE-04 | legacy rating=5, 전체 DTO 없음 | 숫자 rating을 전체 평가로 추정하지 않는다. |
| OE-05 | 전체 liked 입력 후 veryDisliked 정정, 기존 산미 평가 유지 | 동일 식사 최신 전체 평가 하나와 기존 감각 평가를 보존한다. 식사 근거 수를 늘리거나 기존 감각을 바꾸지 않는다. |
| OE-06 | 전체 평가만 clear, 기존 산미 선택 유지 | 전체 원자만 회수되고 산미 직접 평가·원문은 유지된다. |
| OE-07 | 전체 DTO 저장·재시작 | 질문 ID·버전·당시 질문 라벨·응답 원값·당시 응답 라벨·whole_dish·unspecified를 보존한다. phrase/span은 실제 응답 라벨을 가리킨다. |
| OE-08 | 미지원 질문 버전 또는 응답값/라벨 불일치 | 원문 DTO를 보존하고 유보한다. 알려진 전체 값으로 조용히 변경하지 않는다. |

개별 감각 UI의 불호 응답은 공유 계약의 `disliked`를 사용한다. 사용자가 예시로 든 조금 싫음은 두 식사에서 동일하게 유지한다는 비교 조건이며, 새 개별 감각 강도값을 발명하지 않는다.

## 구현 연결과 실제 검증

- Native: `SensoryOverallEvaluationTests.swift`의 동결 의미 검사 8개와 AppModel 저장·정정·clear·재시작 검사 2개가 전체 XCTest 230개 실행에 포함되어 모두 통과했다. 마지막 안내 문구 변경 뒤 별도 흐름 검사 6개도 다시 통과했다. 전체 평가 화면을 전용 시뮬레이터에서 실행하여 5개 응답과 다음 버튼 표시를 확인했다.
- JS: `ai-extraction.test.mjs`의 전체 응답 span 검사와 `experience-evidence.test.mjs`의 PGlite 전체 평가 통합 검사를 추가했다. 관련 ai-extraction/experience-evidence/insight-views 3개 테스트 파일을 묶어 실행한 27개가 모두 통과했다. 실제 외부 API 호출은 0이었다.
- 첫 실행은 생산 분기 반영과 겹쳐 legacy 라우팅의 UNKNOWN_VERSION으로 실패했다. structured_overall 분기가 반영된 뒤 동일 기대값으로 재실행해 통과했으며, 동결 표를 변경하지 않았다.

JS 결과에는 실제 iOS UI 조작이나 기기 재시작 검증이 포함되지 않는다. 다섯 원값의 구분과 다른 감각에 평가를 전파하지 않는 계약을 검사했으며, 이 검사의 통과를 전체 평가의 심리측정 타당성이나 사용자 취향 예측 정확도로 주장하지 않는다.
