package com.shamiacademy.pixprompt

import android.content.Context

/**
 * Simple local storage for favorites (no login/account needed,
 * matches PixPrompt's "data stored locally" behavior).
 */
object PrefsHelper {

    private const val PREFS_NAME = "pixprompt_prefs"
    private const val KEY_FAVORITES = "favorite_ids"

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun getFavoriteIds(context: Context): MutableSet<String> {
        return HashSet(prefs(context).getStringSet(KEY_FAVORITES, emptySet()) ?: emptySet())
    }

    fun isFavorite(context: Context, id: String): Boolean {
        return getFavoriteIds(context).contains(id)
    }

    fun toggleFavorite(context: Context, id: String): Boolean {
        val current = getFavoriteIds(context)
        val nowFavorite: Boolean
        if (current.contains(id)) {
            current.remove(id)
            nowFavorite = false
        } else {
            current.add(id)
            nowFavorite = true
        }
        prefs(context).edit().putStringSet(KEY_FAVORITES, current).apply()
        return nowFavorite
    }
}
