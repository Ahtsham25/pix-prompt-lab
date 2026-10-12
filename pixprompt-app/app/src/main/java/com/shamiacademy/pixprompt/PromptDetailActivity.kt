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
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import com.shamiacademy.pixprompt.databinding.ActivityPromptDetailBinding
import kotlin.math.abs

class PromptDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPromptDetailBinding
    private lateinit var promptId: String
    private lateinit var promptText: String
    private var isVideoPrompt: Boolean = false
    private lateinit var swipeBackDetector: GestureDetector

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPromptDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        promptId = intent.getStringExtra("id") ?: ""
        val title = intent.getStringExtra("title") ?: ""
        val category = intent.getStringExtra("category") ?: ""
        promptText = intent.getStringExtra("prompt_text") ?: ""
        val imageUrl = intent.getStringExtra("image_url") ?: ""
        isVideoPrompt = intent.getBooleanExtra("is_video", false) ||
            intent.getStringExtra("type").equals("video", ignoreCase = true)

        BottomNavHelper.setup(this, if (isVideoPrompt) NavTab.VIDEOS else NavTab.EXPLORE)
        setupSwipeToGoBack()

        binding.detailSubtitle.text = if (isVideoPrompt) "Featured Video Prompt" else "Featured Prompt"
        binding.detailTitle.text = title
        binding.detailCategory.text = category
        binding.detailPromptText.text = promptText

        Glide.with(this)
            .load(imageUrl)
            .placeholder(R.drawable.image_placeholder)
            .error(R.drawable.image_placeholder)
            .transition(DrawableTransitionOptions.withCrossFade(250))
            .fitCenter()
            .into(binding.detailImage)

        updateBookmarkIcon()

        binding.backButton.setOnClickListener { goBack() }

        binding.detailBookmarkButton.setOnClickListener {
            PrefsHelper.toggleFavorite(this, promptId)
            updateBookmarkIcon()
        }

        binding.generateButton.setOnClickListener { runGenerateFlow() }

        binding.copyIconButton.setOnClickListener {
            copyToClipboard(promptText)
            AdsManager.maybeShowInterstitialForCopy(this)
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

        binding.tryFlowButton.setOnClickListener {
            copyToClipboard(promptText, showToast = false)
            Toast.makeText(this, "Prompt copied — paste it into Google Flow", Toast.LENGTH_SHORT).show()
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(Constants.FLOW_WEB_URL)))
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
                    goBack()
                    return true
                }
                return false
            }
        })

        binding.root.setOnTouchListener { _, event ->
            swipeBackDetector.onTouchEvent(event)
            false
        }
    }

    private fun goBack() {
        AdsManager.showInterstitialAlways(this) {
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
    }

    /** Animated "AI processing" delay before revealing the prompt text and action buttons. */
    private fun runGenerateFlow() {
        binding.resultBox.visibility = View.GONE
        binding.detailInlineAdContainer.visibility = View.GONE
        binding.tryAiRow.visibility = View.GONE
        binding.tryFlowButton.visibility = View.GONE
        binding.processingBar.visibility = View.VISIBLE

        Handler(Looper.getMainLooper()).postDelayed({
            binding.processingBar.visibility = View.GONE

            binding.resultBox.alpha = 0f
            binding.resultBox.translationY = 16f
            binding.resultBox.visibility = View.VISIBLE
            binding.resultBox.animate().alpha(1f).translationY(0f).setDuration(280).start()

            binding.detailInlineAdContainer.visibility = View.VISIBLE
            AdsManager.loadBanner(this, binding.detailInlineAdContainer)

            if (isVideoPrompt) {
                binding.tryFlowButton.alpha = 0f
                binding.tryFlowButton.translationY = 16f
                binding.tryFlowButton.visibility = View.VISIBLE
                binding.tryFlowButton.animate().alpha(1f).translationY(0f).setStartDelay(80).setDuration(280).start()
            } else {
                binding.tryAiRow.alpha = 0f
                binding.tryAiRow.translationY = 16f
                binding.tryAiRow.visibility = View.VISIBLE
                binding.tryAiRow.animate().alpha(1f).translationY(0f).setStartDelay(80).setDuration(280).start()
            }
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
