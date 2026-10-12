package com.shamiacademy.pixprompt

import android.content.Intent
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

enum class NavTab { EXPLORE, VIDEOS, FAVORITE }

/**
 * Wires up the shared bottom_nav_bar.xml (included in MainActivity,
 * VideosActivity, and FavoritesActivity) — highlights the active tab and
 * navigates smoothly between the top-level screens.
 */
object BottomNavHelper {

    fun setup(activity: AppCompatActivity, active: NavTab) {
        val exploreTab = activity.findViewById<LinearLayout>(R.id.tabExplore)
        val videosTab = activity.findViewById<LinearLayout>(R.id.tabVideos)
        val favoriteTab = activity.findViewById<LinearLayout>(R.id.tabFavorite)

        val exploreIcon = activity.findViewById<ImageView>(R.id.exploreIcon)
        val videosIcon = activity.findViewById<ImageView>(R.id.videosIcon)
        val favoriteIcon = activity.findViewById<ImageView>(R.id.favoriteIcon)

        val exploreLabel = activity.findViewById<TextView>(R.id.exploreLabel)
        val videosLabel = activity.findViewById<TextView>(R.id.videosLabel)
        val favoriteLabel = activity.findViewById<TextView>(R.id.favoriteLabel)

        val exploreBg = activity.findViewById<FrameLayout>(R.id.exploreIconBg)
        val videosBg = activity.findViewById<FrameLayout>(R.id.videosIconBg)
        val favoriteBg = activity.findViewById<FrameLayout>(R.id.favoriteIconBg)

        // Reset all to inactive
        exploreBg.setBackgroundResource(0)
        videosBg.setBackgroundResource(0)
        favoriteBg.setBackgroundResource(0)
        exploreIcon.setImageResource(R.drawable.ic_search)
        videosIcon.setImageResource(R.drawable.ic_video)
        favoriteIcon.setImageResource(R.drawable.ic_bookmark_border_gray)
        listOf(exploreLabel, videosLabel, favoriteLabel).forEach {
            it.setTextColor(activity.getColor(R.color.text_secondary))
        }

        // Highlight active tab with subtle scale animation
        when (active) {
            NavTab.EXPLORE -> {
                exploreBg.setBackgroundResource(R.drawable.nav_active_circle)
                exploreIcon.setImageResource(R.drawable.ic_search_white)
                exploreLabel.setTextColor(activity.getColor(R.color.text_primary))
                exploreBg.scaleX = 0.85f
                exploreBg.scaleY = 0.85f
                exploreBg.animate().scaleX(1f).scaleY(1f).setDuration(200).start()
            }
            NavTab.VIDEOS -> {
                videosBg.setBackgroundResource(R.drawable.nav_active_circle)
                videosIcon.setImageResource(R.drawable.ic_video_white)
                videosLabel.setTextColor(activity.getColor(R.color.text_primary))
                videosBg.scaleX = 0.85f
                videosBg.scaleY = 0.85f
                videosBg.animate().scaleX(1f).scaleY(1f).setDuration(200).start()
            }
            NavTab.FAVORITE -> {
                favoriteBg.setBackgroundResource(R.drawable.nav_active_circle)
                favoriteIcon.setImageResource(R.drawable.ic_bookmark_border)
                favoriteLabel.setTextColor(activity.getColor(R.color.text_primary))
                favoriteBg.scaleX = 0.85f
                favoriteBg.scaleY = 0.85f
                favoriteBg.animate().scaleX(1f).scaleY(1f).setDuration(200).start()
            }
        }

        exploreTab.setOnClickListener {
            if (active != NavTab.EXPLORE) navigateTo(activity, MainActivity::class.java)
        }
        videosTab.setOnClickListener {
            if (active != NavTab.VIDEOS) navigateTo(activity, VideosActivity::class.java)
        }
        favoriteTab.setOnClickListener {
            if (active != NavTab.FAVORITE) navigateTo(activity, FavoritesActivity::class.java)
        }
    }

    private fun navigateTo(activity: AppCompatActivity, target: Class<*>) {
        val intent = Intent(activity, target)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        activity.startActivity(intent)
        activity.overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}
