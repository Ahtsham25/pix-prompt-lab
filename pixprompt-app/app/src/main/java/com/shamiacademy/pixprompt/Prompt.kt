package com.shamiacademy.pixprompt

data class Prompt(
    val id: String,
    val category: String,
    val title: String,
    val prompt_text: String,
    val image_url: String,
    val tags: List<String> = emptyList(),
    val type: String? = "image"
) {
    fun isVideo(): Boolean = type.equals("video", ignoreCase = true)
}

data class PromptData(
    val categories: List<String> = emptyList(),
    val prompts: List<Prompt> = emptyList(),
    val video_prompts: List<Prompt>? = emptyList()
) {
    fun allImagePrompts(): List<Prompt> {
        return prompts.filter { !it.isVideo() }
    }

    fun allVideoPrompts(): List<Prompt> {
        val fromDedicated = (video_prompts ?: emptyList()).map {
            if (it.type == null) it.copy(type = "video") else it
        }
        val fromMain = prompts.filter { it.isVideo() }
        return (fromDedicated + fromMain).distinctBy { it.id }
    }

    fun allCombinedPrompts(): List<Prompt> {
        return (allImagePrompts() + allVideoPrompts()).distinctBy { it.id }
    }
}
