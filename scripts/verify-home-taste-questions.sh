#!/bin/bash
# Local iOS verification only. Uses an explicitly selected available simulator.
set -euo pipefail
qa_device="${1:?Pass a current simulator UUID from xcrun simctl list devices available}"
qa_scope="${2:-unit}"
qa_run="${3:-$(date +%Y%m%d-%H%M%S)}"
qa_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$qa_root"
qa_args=()
case "$qa_scope" in
  unit)
    qa_scheme=TasteBuddy
    for qa_suite in HomeTasteQuestionsIntegrationTests HomeArchiveSummaryEngineTests HomeSummaryEngineTests HomePeriodInsightEngineTests HomeArchiveMetricsEngineTests TastePerceptionTests PersonalTasteQuestionResolutionTests PersonalTasteModelTests AdvancedPersonalTasteModelTests AppModelAdvancedModelTests SensoryStructuredSelectionTests SensoryOverallEvaluationTests SensoryAnalysisEngineTests PersonalTasteInsightTests LongitudinalFoodMemoryTests LongitudinalMemoryLifecycleTests NativeAccountDataTests ChatGPTAnalysisConnectionTests TasteBloomMotionTests; do
      qa_args+=("-only-testing:TasteBuddyTests/$qa_suite")
    done
    ;;
  ui)
    qa_scheme=TasteBuddyMemoryQA
    qa_args+=("-only-testing:TasteBuddyMemoryUITests/HomeTasteQuestionUITests")
    ;;
  *) printf 'Choose unit or ui\n' >&2; exit 2 ;;
esac
mkdir -p output/home-taste-questions
exec xcodebuild test -project ios/TasteBuddy.xcodeproj -scheme "$qa_scheme" \
  -destination "platform=iOS Simulator,id=$qa_device" \
  -derivedDataPath /tmp/TasteBuddyHomeQuestionsQA \
  -resultBundlePath "output/home-taste-questions/$qa_run.xcresult" \
  -jobs 4 -parallel-testing-enabled NO SWIFT_OPTIMIZATION_LEVEL=-Onone \
  'OTHER_SWIFT_FLAGS=$(inherited) -j4' CODE_SIGNING_ALLOWED=NO \
  "${qa_args[@]}" > "output/home-taste-questions/$qa_run.log" 2>&1
