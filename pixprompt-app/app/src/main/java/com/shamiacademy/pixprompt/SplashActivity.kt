package com.shamiacademy.pixprompt

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.animation.OvershootInterpolator
import androidx.appcompat.app.AppCompatActivity
import com.shamiacademy.pixprompt.databinding.ActivitySplashBinding

/**
 * Branded splash screen for Pixvid Lab with smooth logo scale + fade-in animation.
 */
class SplashActivity : AppCompatActivity() {

    private val splashDurationMs = 1500L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Smooth entrance animation for halo glow, logo, title, and tagline
        binding.splashHalo.scaleX = 0.5f
        binding.splashHalo.scaleY = 0.5f
        binding.splashHalo.alpha = 0f
        binding.splashHalo.animate()
            .scaleX(1.1f)
            .scaleY(1.1f)
            .alpha(0.95f)
            .setDuration(750)
            .start()

        binding.splashLogo.scaleX = 0.65f
        binding.splashLogo.scaleY = 0.65f
        binding.splashLogo.alpha = 0f
        binding.splashLogo.animate()
            .scaleX(1f)
            .scaleY(1f)
            .alpha(1f)
            .setDuration(580)
            .setInterpolator(OvershootInterpolator(1.15f))
            .start()

        binding.splashTitle.alpha = 0f
        binding.splashTitle.translationY = 18f
        binding.splashTitle.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(160)
            .setDuration(420)
            .start()

        binding.splashTagline.alpha = 0f
        binding.splashTagline.translationY = 14f
        binding.splashTagline.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(260)
            .setDuration(420)
            .start()

        ConsentManager.requestConsentInfoUpdate(this)
        ImageLoaderConfig.setup(this)

        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }, splashDurationMs)
    }
}
