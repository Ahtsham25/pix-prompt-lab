package com.shamiacademy.pixprompt

import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader
import com.bumptech.glide.load.model.GlideUrl
import okhttp3.OkHttpClient
import java.io.InputStream
import java.util.concurrent.TimeUnit

/**
 * Makes Glide use our own OkHttpClient (instead of its default,
 * short-timeout HttpURLConnection stack) with:
 *  - a longer timeout, since hosts like archive.org can be slow to
 *    respond on first request for a file
 *  - a normal browser User-Agent, since some hosts rate-limit or block
 *    requests that don't send one
 *
 * Call ImageLoaderConfig.setup(context) once, early (done in
 * SplashActivity), before any image loading happens.
 */
object ImageLoaderConfig {

    private var configured = false

    fun setup(context: Context) {
        if (configured) return
        configured = true

        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .header(
                        "User-Agent",
                        "Mozilla/5.0 (Linux; Android) PixPromptLab/1.0 (+https://shamiacademy)"
                    )
                    .build()
                chain.proceed(request)
            }
            .build()

        Glide.get(context).registry.replace(
            GlideUrl::class.java, InputStream::class.java, OkHttpUrlLoader.Factory(client)
        )
    }
}
