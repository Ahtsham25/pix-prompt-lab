package com.shamiacademy.pixprompt

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import com.shamiacademy.pixprompt.databinding.ActivityFavoritesBinding
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope

class FavoritesActivity : AppCompatActivity() {

    private lateinit var binding: ActivityFavoritesBinding
    private lateinit var adapter: PromptAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityFavoritesBinding.inflate(layoutInflater)
        setContentView(binding.root)

        BottomNavHelper.setup(this, NavTab.FAVORITE)
        binding.menuButton.setOnClickListener {
            MoreSettingsBottomSheet().show(supportFragmentManager, "more_settings")
        }

        adapter = PromptAdapter(
            items = emptyList(),
            isFavorite = { id -> PrefsHelper.isFavorite(this, id) },
            onClick = { prompt -> openDetail(prompt) },
            onBookmarkClick = { prompt, holder ->
                PrefsHelper.toggleFavorite(this, prompt.id)
                loadFavorites() // refresh list since item may need to disappear
            }
        )
        binding.favoritesRecycler.layoutManager = GridLayoutManager(this, 2)
        binding.favoritesRecycler.adapter = adapter

        loadFavorites()
    }

    override fun onResume() {
        super.onResume()
        loadFavorites()
    }

    private fun loadFavorites() {
        lifecycleScope.launch {
            val result = DataRepository.loadPrompts()
            result.onSuccess { data ->
                val favoriteIds = PrefsHelper.getFavoriteIds(this@FavoritesActivity)
                val favoritePrompts = data.prompts.filter { favoriteIds.contains(it.id) }
                adapter.updateItems(favoritePrompts)
                binding.favEmptyText.text = getString(R.string.no_favorites)
                binding.favEmptyText.visibility =
                    if (favoritePrompts.isEmpty()) View.VISIBLE else View.GONE
            }.onFailure {
                adapter.updateItems(emptyList())
                binding.favEmptyText.text = getString(R.string.load_failed)
                binding.favEmptyText.visibility = View.VISIBLE
            }
        }
    }

    private fun openDetail(prompt: Prompt) {
        AdsManager.showInterstitialAlways(this) {
            val intent = Intent(this, PromptDetailActivity::class.java)
            intent.putExtra("id", prompt.id)
            intent.putExtra("title", prompt.title)
            intent.putExtra("category", prompt.category)
            intent.putExtra("prompt_text", prompt.prompt_text)
            intent.putExtra("image_url", prompt.image_url)
            startActivity(intent)
        }
    }
}
