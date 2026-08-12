package com.shamiacademy.pixprompt

import android.content.Intent
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

enum class NavTab { EXPLORE, FAVORITE }

/**
 * Wires up the shared bottom_nav_bar.xml (included in MainActivity and
 * FavoritesActivity) — highlights the active tab and navigates between
 * the two top-level screens.
 */
object BottomNavHelper {

    fun setup(activity: AppCompatActivity, active: NavTab) {
        val exploreTab = activity.findViewById<LinearLayout>(R.id.tabExplore)
        val favoriteTab = activity.findViewById<LinearLayout>(R.id.tabFavorite)

        val exploreIcon = activity.findViewById<ImageView>(R.id.exploreIcon)
        val favoriteIcon = activity.findViewById<ImageView>(R.id.favoriteIcon)

        val exploreLabel = activity.findViewById<TextView>(R.id.exploreLabel)
        val favoriteLabel = activity.findViewById<TextView>(R.id.favoriteLabel)

        val exploreBg = activity.findViewById<FrameLayout>(R.id.exploreIconBg)
        val favoriteBg = activity.findViewById<FrameLayout>(R.id.favoriteIconBg)

        // Reset all to inactive
        exploreBg.setBackgroundResource(0)
        favoriteBg.setBackgroundResource(0)
        exploreIcon.setImageResource(R.drawable.ic_search)
        favoriteIcon.setImageResource(R.drawable.ic_bookmark_border_gray)
        listOf(exploreLabel, favoriteLabel).forEach {
            it.setTextColor(activity.getColor(R.color.text_secondary))
        }

        // Highlight active tab
        when (active) {
            NavTab.EXPLORE -> {
                exploreBg.setBackgroundResource(R.drawable.nav_active_circle)
                exploreIcon.setImageResource(R.drawable.ic_search_white)
                exploreLabel.setTextColor(activity.getColor(R.color.text_primary))
            }
            NavTab.FAVORITE -> {
                favoriteBg.setBackgroundResource(R.drawable.nav_active_circle)
                favoriteIcon.setImageResource(R.drawable.ic_bookmark_border)
                favoriteLabel.setTextColor(activity.getColor(R.color.text_primary))
            }
        }

        exploreTab.setOnClickListener {
            if (active != NavTab.EXPLORE) navigateTo(activity, MainActivity::class.java)
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
