package com.shamiacademy.pixprompt

data class Prompt(
    val id: String,
    val category: String,
    val title: String,
    val prompt_text: String,
    val image_url: String,
    val tags: List<String> = emptyList()
)

data class PromptData(
    val categories: List<String>,
    val prompts: List<Prompt>
)
