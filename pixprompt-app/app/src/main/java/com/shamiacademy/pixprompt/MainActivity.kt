package com.shamiacademy.pixprompt

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.shamiacademy.pixprompt.databinding.ActivityMainBinding
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var promptAdapter: PromptAdapter

    private var allPrompts: List<Prompt> = emptyList()
    private var categories: List<String> = listOf("All")
    private var selectedCategory: String = "All"
    private var searchQuery: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        AdsManager.init(this)
        AdsManager.loadBanner(this, binding.adContainer)

        BottomNavHelper.setup(this, NavTab.EXPLORE)
        binding.menuButton.setOnClickListener {
            MoreSettingsBottomSheet().show(supportFragmentManager, "more_settings")
        }

        setupRecycler()
        setupSearch()
        loadData()

        binding.swipeRefresh.setOnRefreshListener { loadData() }
    }

    private fun setupRecycler() {
        promptAdapter = PromptAdapter(
            items = emptyList(),
            isFavorite = { id -> PrefsHelper.isFavorite(this, id) },
            onClick = { prompt -> openDetail(prompt) },
            onBookmarkClick = { prompt, holder ->
                val nowFavorite = PrefsHelper.toggleFavorite(this, prompt.id)
                promptAdapter.updateBookmarkIcon(holder, nowFavorite)
                Toast.makeText(
                    this,
                    if (nowFavorite) getString(R.string.bookmarked) else getString(R.string.unbookmarked),
                    Toast.LENGTH_SHORT
                ).show()
            }
        )
        binding.promptRecycler.layoutManager = GridLayoutManager(this, 2)
        binding.promptRecycler.adapter = promptAdapter
    }

    private fun setupSearch() {
        binding.searchInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                searchQuery = s?.toString()?.trim() ?: ""
                applyFilters()
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun loadData() {
        binding.progressBar.visibility = View.VISIBLE
        binding.emptyText.visibility = View.GONE

        lifecycleScope.launch {
            val result = DataRepository.loadPrompts()
            binding.progressBar.visibility = View.GONE
            binding.swipeRefresh.isRefreshing = false

            result.onSuccess { data ->
                allPrompts = data.prompts
                categories = listOf("All") + data.categories
                setupCategoryRecycler()
                applyFilters()
            }.onFailure {
                promptAdapter.updateItems(emptyList())
                binding.emptyText.text = getString(R.string.load_failed)
                binding.emptyText.visibility = View.VISIBLE
                Toast.makeText(this@MainActivity, R.string.load_failed, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupCategoryRecycler() {
        binding.categoryRecycler.layoutManager =
            LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        binding.categoryRecycler.adapter = CategoryAdapter(categories, selectedCategory) { category ->
            selectedCategory = category
            applyFilters()
        }
    }

    private fun applyFilters() {
        var filtered = allPrompts

        if (selectedCategory != "All") {
            filtered = filtered.filter { it.category.equals(selectedCategory, ignoreCase = true) }
        }

        if (searchQuery.isNotEmpty()) {
            filtered = filtered.filter {
                it.title.contains(searchQuery, ignoreCase = true) ||
                    it.prompt_text.contains(searchQuery, ignoreCase = true) ||
                    it.tags.any { tag -> tag.contains(searchQuery, ignoreCase = true) }
            }
        }

        promptAdapter.updateItems(filtered)
        binding.emptyText.text = getString(R.string.no_results)
        binding.emptyText.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun openDetail(prompt: Prompt) {
        val intent = Intent(this, PromptDetailActivity::class.java)
        intent.putExtra("id", prompt.id)
        intent.putExtra("title", prompt.title)
        intent.putExtra("category", prompt.category)
        intent.putExtra("prompt_text", prompt.prompt_text)
        intent.putExtra("image_url", prompt.image_url)
        startActivity(intent)
    }

    override fun onResume() {
        super.onResume()
        // refresh bookmark icons in case favorites changed elsewhere
        promptAdapter.notifyDataSetChanged()
    }
}
