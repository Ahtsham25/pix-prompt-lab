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

        // Smooth entrance animation for logo and title
        binding.splashLogo.scaleX = 0.65f
        binding.splashLogo.scaleY = 0.65f
        binding.splashLogo.alpha = 0f
        binding.splashLogo.animate()
            .scaleX(1f)
            .scaleY(1f)
            .alpha(1f)
            .setDuration(550)
            .setInterpolator(OvershootInterpolator(1.2f))
            .start()

        binding.splashTitle.alpha = 0f
        binding.splashTitle.translationY = 18f
        binding.splashTitle.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(180)
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
