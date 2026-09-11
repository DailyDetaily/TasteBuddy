package com.tastebuddy.android.domain

import kotlinx.serialization.json.*
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized

@RunWith(Parameterized::class)
class IosContractParityTest(
    private val name: String,
    private val kind: String,
    private val fixture: JsonObject,
) {
    @Test
    fun matchesIosContract() {
        when (kind) {
            "selection" -> {
                val selections = fixture.array("selections").map(SensorySelection::fromRaw)
                val expected =
                    AppJson.decodeFromJsonElement<RuleResult>(fixture.getValue("expected"))
                assertEquals(name, expected, SelectionParser.parse(selections, catalog))
            }
            "overall" ->
                assertEquals(
                    name,
                    AppJson.decodeFromJsonElement<RuleResult>(fixture.getValue("expected")),
                    OverallEvaluation.fromRaw(fixture.getValue("evaluation")).parse(),
                )
            "sensory" -> {
                val answer = fixture.obj("answer")
                val target = answer["target"]?.jsonPrimitive?.contentOrNull
                val phase = answer["phase"]?.jsonPrimitive?.contentOrNull
                val value = answer.getValue("value")
                val parser = SensoryParser(contract)
                val actual =
                    if (value is JsonArray) {
                        val parsed = value.map {
                            parser.parseChoice(
                                it.jsonObject.string("label"),
                                it.jsonObject.string("id"),
                                target,
                                phase,
                            )
                        }
                        RuleResult(
                            parsed.flatMap { it.observations },
                            parsed.flatMap { it.unresolved },
                            parsed.any { it.needsAI },
                        )
                    } else parser.parse(value.jsonPrimitive.content, target, phase)
                assertEquals(
                    name,
                    AppJson.decodeFromJsonElement<RuleResult>(fixture.getValue("expected")),
                    actual,
                )
            }
            "profile" -> {
                val entries =
                    fixture.array("notes").mapIndexed { index, note ->
                        DiningEntry(
                            id = "00000000-0000-0000-0000-%012d".format(index + 1),
                            restaurant = "검증 식당",
                            menu = "검증 음식",
                            note = note.jsonPrimitive.content,
                            feedbackStatus = "completed",
                        )
                    }
                val actual = SensoryAnalyzer(contract).analyze(entries).mainWing
                val expected = fixture.obj("expected")
                assertEquals(name, expected.string("status"), actual.status)
                assertEquals(
                    name,
                    expected["mainID"]?.jsonPrimitive?.contentOrNull,
                    actual.main?.id,
                )
                assertEquals(
                    name,
                    expected["wingID"]?.jsonPrimitive?.contentOrNull,
                    actual.wing?.id,
                )
                for (row in expected.array("candidates")) {
                    val e = row.jsonObject
                    val a = actual.candidates.first { it.id == e.string("id") }
                    assertEquals("$name ${a.id}", e.string("status"), a.status)
                    assertEquals(
                        "$name ${a.id}",
                        e.getValue("supportExperienceCount").jsonPrimitive.int,
                        a.supportExperienceCount,
                    )
                    assertEquals(
                        "$name ${a.id}",
                        e.getValue("counterExperienceCount").jsonPrimitive.int,
                        a.counterExperienceCount,
                    )
                    assertEquals(
                        "$name ${a.id}",
                        e.getValue("eligible").jsonPrimitive.boolean,
                        a.eligible,
                    )
                }
            }
            "personal" -> {
                val records =
                    AppJson.decodeFromJsonElement<List<PersonalRecord>>(fixture.getValue("records"))
                val actual =
                    PersonalTasteModel.build(
                        records,
                        fixture.string("userID"),
                        parseInstant(fixture["asOf"]?.jsonPrimitive?.contentOrNull),
                    )
                assertEquals(
                    name,
                    AppJson.decodeFromJsonElement<PersonalSnapshot>(fixture.getValue("expected")),
                    actual,
                )
                for (prediction in fixture.array("predictions")) {
                    val row = prediction.jsonObject
                    val query = AppJson.decodeFromJsonElement<PersonalQuery>(row.getValue("query"))
                    assertEquals(
                        name,
                        AppJson.decodeFromJsonElement<PersonalPrediction>(row.getValue("expected")),
                        PersonalTasteModel.predict(actual, query),
                    )
                }
            }
            "survey" -> {
                val responses =
                    AppJson.decodeFromJsonElement<List<SurveyResponse>>(
                        fixture.getValue("responses")
                    )
                val expected =
                    AppJson.decodeFromJsonElement<SurveyResult>(fixture.getValue("expected"))
                val actual =
                    SurveyScoring.result(survey.items, responses, expected.snapshot.measuredAt)
                assertEquals(name, expected, actual)
            }
        }
    }

    companion object {
        private fun load(path: String) =
            AppJson.parseToJsonElement(
                    checkNotNull(javaClass.classLoader?.getResourceAsStream(path)) { path }
                        .bufferedReader()
                        .use { it.readText() }
                )
                .jsonObject

        private val sensoryJson by lazy { load("tba/tba-sensory-contract.json") }
        private val catalogJson by lazy { load("tba/dining-sensory-selection-catalog.json") }
        private val personalJson by lazy { load("tba/personal-taste-model-contract.json") }
        private val surveyJson by lazy { load("fixtures/taste-survey-golden.json") }
        private val contract by lazy { AppJson.decodeFromJsonElement<SensoryContract>(sensoryJson) }
        private val catalog by lazy { AppJson.decodeFromJsonElement<SelectionCatalog>(catalogJson) }
        private val survey by lazy { AppJson.decodeFromJsonElement<SurveyCatalog>(surveyJson) }

        @JvmStatic
        @Parameterized.Parameters(name = "{0}")
        fun fixtures(): List<Array<Any>> = buildList {
            fun cases(kind: String, values: JsonArray) {
                for (raw in values) {
                    val f = raw.jsonObject
                    add(arrayOf<Any>("$kind:${f.string("id")}", kind, f))
                }
            }
            cases("selection", catalogJson.array("fixtures"))
            cases("overall", sensoryJson.obj("overallEvaluationContract").array("fixtures"))
            cases("sensory", sensoryJson.array("fixtures"))
            cases("profile", sensoryJson.array("profileFixtures"))
            cases("personal", personalJson.array("fixtures"))
            cases("survey", surveyJson.array("cases"))
        }
    }
}
