package com.shamiacademy.pixprompt

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Url

/**
 * Retrofit interface for fetching prompts.json.
 * We use a dynamic @Url so you can point it at any raw JSON link
 * (GitHub raw, your own server, etc.) without changing this file —
 * just edit Constants.PROMPTS_JSON_URL.
 */
interface ApiService {
    @GET
    suspend fun getPrompts(@Url url: String): Response<PromptData>
}
