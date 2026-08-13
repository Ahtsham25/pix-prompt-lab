package com.shamiacademy.pixprompt

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.shamiacademy.pixprompt.databinding.ActivitySplashBinding

/**
 * Simple branded splash screen: shows the app logo + name for a short
 * moment while nothing else needs loading yet, then opens MainActivity.
 * (Prompt data itself is fetched inside MainActivity, with its own
 * progress bar / offline fallback.)
 */
class SplashActivity : AppCompatActivity() {

    private val splashDurationMs = 1400L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        ConsentManager.requestConsentInfoUpdate(this)
        ImageLoaderConfig.setup(this)

        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }, splashDurationMs)
    }
}
