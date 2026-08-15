package com.shamiacademy.pixprompt

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide
import com.shamiacademy.pixprompt.databinding.ActivityPromptDetailBinding
import kotlin.math.abs

class PromptDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPromptDetailBinding
    private lateinit var promptId: String
    private lateinit var promptText: String
    private lateinit var swipeBackDetector: GestureDetector

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPromptDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        BottomNavHelper.setup(this, NavTab.EXPLORE)
        setupSwipeToGoBack()

        promptId = intent.getStringExtra("id") ?: ""
        val title = intent.getStringExtra("title") ?: ""
        val category = intent.getStringExtra("category") ?: ""
        promptText = intent.getStringExtra("prompt_text") ?: ""
        val imageUrl = intent.getStringExtra("image_url") ?: ""

        binding.detailTitle.text = title
        binding.detailCategory.text = category
        binding.detailPromptText.text = promptText

        Glide.with(this)
            .load(imageUrl)
            .placeholder(R.drawable.image_placeholder)
            .error(R.drawable.image_placeholder)
            .fitCenter()
            .into(binding.detailImage)

        updateBookmarkIcon()

        binding.backButton.setOnClickListener { finish() }

        binding.detailBookmarkButton.setOnClickListener {
            PrefsHelper.toggleFavorite(this, promptId)
            updateBookmarkIcon()
        }

        binding.generateButton.setOnClickListener { runGenerateFlow() }

        binding.copyIconButton.setOnClickListener {
            copyToClipboard(promptText)
            AdsManager.maybeShowInterstitial(this)
        }

        binding.tryGeminiButton.setOnClickListener {
            copyToClipboard(promptText, showToast = false)
            Toast.makeText(this, "Prompt copied — paste it into Gemini", Toast.LENGTH_SHORT).show()
            openAiApp(Constants.GEMINI_PACKAGE, Constants.GEMINI_WEB_URL)
        }

        binding.tryChatGptButton.setOnClickListener {
            copyToClipboard(promptText, showToast = false)
            Toast.makeText(this, "Prompt copied — paste it into ChatGPT", Toast.LENGTH_SHORT).show()
            openAiApp(Constants.CHATGPT_PACKAGE, Constants.CHATGPT_WEB_URL)
        }
    }

    /** Tries to open the given app by package name; falls back to its website if not installed. */
    private fun openAiApp(packageName: String, webUrl: String) {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            startActivity(launchIntent)
        } else {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(webUrl)))
        }
    }

    /** Swipe left-to-right anywhere on the screen to go back, instead of tapping the back arrow. */
    private fun setupSwipeToGoBack() {
        swipeBackDetector = GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onFling(
                e1: MotionEvent?,
                e2: MotionEvent,
                velocityX: Float,
                velocityY: Float
            ): Boolean {
                if (e1 == null) return false
                val deltaX = e2.x - e1.x
                val deltaY = e2.y - e1.y
                if (deltaX > 120 && abs(deltaX) > abs(deltaY) && velocityX > 250) {
                    finish()
                    overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                    return true
                }
                return false
            }
        })

        binding.root.setOnTouchListener { _, event ->
            swipeBackDetector.onTouchEvent(event)
            false // never block normal button taps/scrolling
        }
    }

    /** Fake "AI processing" delay before revealing the (already-known) prompt text. */
    private fun runGenerateFlow() {
        binding.resultBox.visibility = View.GONE
        binding.detailInlineAdContainer.visibility = View.GONE
        binding.tryAiRow.visibility = View.GONE
        binding.processingBar.visibility = View.VISIBLE

        Handler(Looper.getMainLooper()).postDelayed({
            binding.processingBar.visibility = View.GONE
            binding.resultBox.visibility = View.VISIBLE
            binding.detailInlineAdContainer.visibility = View.VISIBLE
            AdsManager.loadBanner(this, binding.detailInlineAdContainer)
            binding.tryAiRow.visibility = View.VISIBLE
        }, 1500L)
    }

    private fun updateBookmarkIcon() {
        val favorite = PrefsHelper.isFavorite(this, promptId)
        binding.detailBookmarkButton.setImageResource(
            if (favorite) R.drawable.ic_bookmark else R.drawable.ic_bookmark_border
        )
    }

    private fun copyToClipboard(text: String, showToast: Boolean = true) {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("prompt", text)
        clipboard.setPrimaryClip(clip)
        if (showToast) {
            Toast.makeText(this, R.string.copied, Toast.LENGTH_SHORT).show()
        }
    }
}
