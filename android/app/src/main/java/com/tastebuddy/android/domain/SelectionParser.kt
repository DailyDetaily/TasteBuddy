package com.tastebuddy.android.domain

import kotlinx.serialization.json.JsonPrimitive

/** 고정 ID·버전·선택 당시 문구가 일치하는 응답만 해석한다. */
object SelectionParser {
    fun parse(selections: List<SensorySelection>, catalog: SelectionCatalog): RuleResult {
        val unique = selections.distinctBy { canonical(it) }
        val groups = unique.groupBy { "${it.type}:${it.id}" }
        val entries = catalog.entries.associateBy { "${it.type}:${it.id}" }
        val observations = mutableListOf<RuleAtom>()
        val unresolved = mutableListOf<RuleUnresolved>()
        val scales =
            mapOf(
                "sensory_presence" to "presence-v1",
                "sensory_detail" to "sensory-detail-v1",
                "sensory_intensity" to "expression-strength-v1",
                "attribute_liking" to "attribute-three-category-v1",
                "preference_fit" to "preference-fit-v1",
            )
        for (selection in unique) {
            val label = selection.labelSnapshot
            val key = "${selection.type}:${selection.id}"
            val entry = entries[key]
            val parent =
                selection.relatedBubbleID?.let { id ->
                    unique.firstOrNull { it.type == "bubble" && it.id == id }
                }
            val parentEntry = parent?.let { entries["bubble:${it.id}"] }
            val spans = listOf(SourceSpan(0, label.length, label))
            var target = selection.target
            var phase = selection.phase
            fun metadata(
                facet: String = "selection",
                response: String? = null,
                resolution: String? = null,
            ): SelectionEvidence {
                val value = response ?: selection.id
                return SelectionEvidence(
                    selection.id,
                    selection.type,
                    selection.catalogVersion,
                    label,
                    facet,
                    catalog.labels[facet]?.get(value) ?: label,
                    value,
                    selection.relatedBubbleID,
                    parent?.labelSnapshot,
                    resolution ?: entry?.resolution ?: "unresolved",
                )
            }
            fun pending(reason: String, facet: String = "selection", response: String? = null) {
                unresolved +=
                    RuleUnresolved(label, reason, spans, metadata(facet, response, "unresolved"))
            }
            if (selection.unparsedPayload != null) {
                pending("unreadable_selection_payload", response = canonical(selection))
                continue
            }
            if (selection.catalogVersion != catalog.version) {
                pending("unknown_selection_catalog_version")
                continue
            }
            if (entry == null) {
                pending("unknown_selection_id")
                continue
            }
            if (label != entry.label) {
                pending("selection_label_mismatch")
                continue
            }
            if (groups[key]?.size != 1) {
                pending("conflicting_choice_responses", "conflict", canonical(selection))
                continue
            }
            val fields =
                listOf(
                    "liking" to selection.liking,
                    "intensity" to selection.intensity,
                    "preferenceFit" to selection.preferenceFit,
                    "target" to target,
                    "phase" to phase,
                )
            val invalid = fields.firstOrNull { (field, value) ->
                value != null && catalog.values[field]?.get(value) == null
            }
            if (invalid != null) {
                pending("unknown_selection_response", invalid.first, invalid.second)
                continue
            }
            val validParent =
                parent != null &&
                    parentEntry != null &&
                    parent.catalogVersion == catalog.version &&
                    parent.labelSnapshot == parentEntry.label &&
                    groups["bubble:${parent.id}"]?.size == 1
            if (selection.relatedBubbleID != null && !validParent)
                pending("related_bubble_unavailable", "relation", selection.relatedBubbleID)
            if (validParent && parent != null && parentEntry != null) {
                if (target == "unspecified")
                    target =
                        if (parent.target != "unspecified") parent.target
                        else parentEntry.intrinsicTarget ?: target
                if (phase == "unspecified") phase = parent.phase
            }
            if (
                (entry.intrinsicTarget != null &&
                    target != "unspecified" &&
                    target != entry.intrinsicTarget) ||
                    (entry.intrinsicPhase != null &&
                        phase != "unspecified" &&
                        phase != entry.intrinsicPhase)
            ) {
                pending(
                    "conflicting_selection_scope",
                    if (entry.intrinsicTarget != null) "target" else "phase",
                    if (entry.intrinsicTarget != null) target else phase,
                )
                continue
            }
            target = entry.intrinsicTarget ?: target
            phase = entry.intrinsicPhase ?: phase
            val attribute = entry.attribute
            val detailAttribute =
                if (validParent && entry.contextRole != null) parentEntry?.attribute ?: attribute
                else attribute
            fun add(
                kind: String,
                attr: String,
                value: JsonPrimitive,
                facet: String = "selection",
                response: String? = null,
            ) {
                val reference =
                    when {
                        attr == entry.attribute && entry.reference == true -> label
                        attr == parentEntry?.attribute && parentEntry.reference == true ->
                            parent?.labelSnapshot
                        else -> null
                    }
                observations +=
                    RuleAtom(
                        kind,
                        attr,
                        value,
                        scales[kind].orEmpty(),
                        target,
                        phase,
                        label,
                        spans,
                        reference,
                        selectionEvidence = metadata(facet, response),
                    )
            }
            if (!attribute.endsWith(".unspecified"))
                add("sensory_presence", attribute, JsonPrimitive(true))
            add("sensory_detail", detailAttribute, JsonPrimitive(label))
            val intensity = selection.intensity?.let { catalog.values["intensity"]?.get(it) }
            if (
                entry.intrinsicIntensity != null &&
                    intensity != null &&
                    entry.intrinsicIntensity != intensity
            )
                pending("conflicting_selection_intensity", "intensity", selection.intensity)
            else
                (intensity ?: entry.intrinsicIntensity)?.let { value ->
                    add(
                        "sensory_intensity",
                        if (entry.contextRole == "intensity" && validParent)
                            parentEntry?.attribute ?: attribute
                        else attribute,
                        JsonPrimitive(value),
                        if (selection.intensity == null) "selection" else "intensity",
                        selection.intensity,
                    )
                }
            val fit = selection.preferenceFit?.let { catalog.values["preferenceFit"]?.get(it) }
            if (entry.intrinsicFit != null && fit != null && entry.intrinsicFit != fit)
                pending(
                    "conflicting_selection_preference_fit",
                    "preferenceFit",
                    selection.preferenceFit,
                )
            else
                (fit ?: entry.intrinsicFit)?.let {
                    add(
                        "preference_fit",
                        attribute,
                        JsonPrimitive(it),
                        if (selection.preferenceFit == null) "selection" else "preferenceFit",
                        selection.preferenceFit,
                    )
                }
            selection.liking?.let { liking ->
                catalog.values["liking"]?.get(liking)?.let {
                    add("attribute_liking", attribute, JsonPrimitive(it), "liking", liking)
                }
            }
        }
        return RuleResult(observations, unresolved)
    }
}
