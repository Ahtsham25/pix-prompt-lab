package com.shamiacademy.pixprompt

data class Prompt(
    val id: String,
    val category: String,
    val title: String,
    val prompt_text: String,
    val image_url: String,
    val tags: List<String> = emptyList(),
    val type: String? = "image",
    val created_at: String? = null,
    val timestamp: Long? = null
) {
    fun isVideo(): Boolean = type.equals("video", ignoreCase = true)

    /**
     * Computes a deterministic epoch millisecond timestamp so that newer posts
     * always appear first (Date by Date, Time by Time).
     */
    fun effectiveTimestamp(): Long {
        if (timestamp != null && timestamp > 0L) return timestamp
        // Extract 13-digit epoch timestamp from image_url or id if present
        val combined = "$image_url $id"
        val epochMatch = Regex("""(\d{13})""").find(combined)
        if (epochMatch != null) {
            epochMatch.groupValues[1].toLongOrNull()?.let { return it }
        }
        // Extract sequential prompt number (e.g. prompt_016 -> 16)
        val seqMatch = Regex("""prompt_0*(\d+)$""", RegexOption.IGNORE_CASE).find(id)
        if (seqMatch != null) {
            seqMatch.groupValues[1].toLongOrNull()?.let {
                return 1700000000000L + it * 3600_000L
            }
        }
        return 0L
    }
}

data class PromptData(
    val categories: List<String> = emptyList(),
    val prompts: List<Prompt> = emptyList(),
    val video_prompts: List<Prompt>? = emptyList()
) {
    fun allImagePrompts(): List<Prompt> {
        return prompts
            .filter { !it.isVideo() }
            .sortedByDescending { it.effectiveTimestamp() }
    }

    fun allVideoPrompts(): List<Prompt> {
        val fromDedicated = (video_prompts ?: emptyList()).map {
            if (it.type == null) it.copy(type = "video") else it
        }
        val fromMain = prompts.filter { it.isVideo() }
        return (fromDedicated + fromMain)
            .distinctBy { it.id }
            .sortedByDescending { it.effectiveTimestamp() }
    }

    fun allCombinedPrompts(): List<Prompt> {
        return (allImagePrompts() + allVideoPrompts())
            .distinctBy { it.id }
            .sortedByDescending { it.effectiveTimestamp() }
    }
}
