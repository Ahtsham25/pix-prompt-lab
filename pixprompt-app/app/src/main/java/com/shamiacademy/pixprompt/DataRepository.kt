package com.shamiacademy.pixprompt

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient

/**
 * Fetches prompts.json at runtime via Retrofit from Constants.PROMPTS_JSON_URL.
 * No local copy is bundled in the app — this means every time you edit and
 * push a new prompts.json to your hosting (GitHub raw, your own server,
 * etc.), the app shows the update immediately for all users, with no new
 * APK build or reinstall needed.
 *
 * Because there's no offline fallback, an internet connection is required
 * to load prompts. If the request fails, loadPrompts() returns a failure
 * Result and the screen shows an error message (see MainActivity).
 */
object DataRepository {

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        // baseUrl is required by Retrofit but unused since we pass a full
        // absolute URL via @Url in ApiService — any placeholder works.
        .baseUrl("https://raw.githubusercontent.com/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val api = retrofit.create(ApiService::class.java)

    suspend fun loadPrompts(): Result<PromptData> = withContext(Dispatchers.IO) {
        try {
            val response = api.getPrompts(Constants.PROMPTS_JSON_URL)
            if (response.isSuccessful) {
                val data = response.body()
                if (data != null) Result.success(data)
                else Result.failure(Exception("Empty response body"))
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
