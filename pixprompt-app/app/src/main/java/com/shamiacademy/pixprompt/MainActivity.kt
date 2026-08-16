package com.shamiacademy.pixprompt

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.shamiacademy.pixprompt.databinding.ActivityMainBinding
import kotlinx.coroutines.launch
import kotlin.math.abs

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var promptAdapter: ExploreGridAdapter

    private var allPrompts: List<Prompt> = emptyList()
    private var filteredPrompts: List<Prompt> = emptyList()

    // Number of prompts currently visible
    private var visibleCount: Int = ExploreGridAdapter.PAGE_SIZE

    private var categories: List<String> = listOf("All")
    private var selectedCategory: String = "All"
    private var searchQuery: String = ""

    private lateinit var swipeGestureDetector: GestureDetector

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Ads
        AdsManager.init(this)
        AdsManager.loadBanner(this, binding.adContainer)

        // Bottom navigation
        BottomNavHelper.setup(this, NavTab.EXPLORE)

        // Menu
        binding.menuButton.setOnClickListener {
            MoreSettingsBottomSheet().show(
                supportFragmentManager,
                "more_settings"
            )
        }

        setupRecycler()
        setupCategorySwipeGesture()
        setupSearch()

        // Load prompts
        loadData()

        // Pull to refresh
        binding.swipeRefresh.setOnRefreshListener {
            loadData()
        }
    }

    /**
     * Setup Explore prompt grid.
     */
    private fun setupRecycler() {

        promptAdapter = ExploreGridAdapter(
            activity = this,

            prompts = emptyList(),

            isFavorite = { id ->
                PrefsHelper.isFavorite(this, id)
            },

            onClick = { prompt ->
                openDetail(prompt)
            },

            onBookmarkClick = { prompt, holder ->

                val nowFavorite =
                    PrefsHelper.toggleFavorite(this, prompt.id)

                holder.bookmark.setImageResource(
                    if (nowFavorite) {
                        R.drawable.ic_bookmark
                    } else {
                        R.drawable.ic_bookmark_border
                    }
                )

                Toast.makeText(
                    this,
                    if (nowFavorite) {
                        getString(R.string.bookmarked)
                    } else {
                        getString(R.string.unbookmarked)
                    },
                    Toast.LENGTH_SHORT
                ).show()
            },

            onLoadMoreClick = {
                handleLoadMoreClick()
            }
        )

        val gridLayoutManager =
            GridLayoutManager(this, 2)

        /*
         * Prompt cards = 1 column
         * Ads = full width
         * Load More = full width
         */
        gridLayoutManager.spanSizeLookup =
            object : GridLayoutManager.SpanSizeLookup() {

                override fun getSpanSize(position: Int): Int {

                    val type =
                        promptAdapter.getItemViewType(position)

                    return if (
                        type == ExploreGridAdapter.TYPE_AD ||
                        type == ExploreGridAdapter.TYPE_LOAD_MORE
                    ) {
                        2
                    } else {
                        1
                    }
                }
            }

        binding.promptRecycler.layoutManager =
            gridLayoutManager

        binding.promptRecycler.adapter =
            promptAdapter
    }

    /**
     * Load More requires rewarded ad.
     */
    private fun handleLoadMoreClick() {

        AdsManager.showRewardedAd(
            this,

            onReward = {

                visibleCount +=
                    ExploreGridAdapter.PAGE_SIZE

                renderVisibleList()
            },

            onUnavailable = {

                Toast.makeText(
                    this,
                    "Ad isn't ready yet — please try again in a moment",
                    Toast.LENGTH_SHORT
                ).show()
            }
        )
    }

    /**
     * Search box.
     */
    private fun setupSearch() {

        binding.searchInput.addTextChangedListener(
            object : TextWatcher {

                override fun beforeTextChanged(
                    s: CharSequence?,
                    start: Int,
                    count: Int,
                    after: Int
                ) {
                }

                override fun onTextChanged(
                    s: CharSequence?,
                    start: Int,
                    before: Int,
                    count: Int
                ) {

                    searchQuery =
                        s?.toString()?.trim() ?: ""

                    applyFilters()
                }

                override fun afterTextChanged(
                    s: Editable?
                ) {
                }
            }
        )
    }

    /**
     * Load all prompt data.
     */
    private fun loadData() {

        binding.progressBar.visibility =
            View.VISIBLE

        binding.emptyText.visibility =
            View.GONE

        lifecycleScope.launch {

            val result =
                DataRepository.loadPrompts()

            binding.progressBar.visibility =
                View.GONE

            binding.swipeRefresh.isRefreshing =
                false

            result.onSuccess { data ->

                allPrompts =
                    data.prompts

                categories =
                    listOf("All") + data.categories

                /*
                 * If selected category no longer exists,
                 * return to All.
                 */
                if (
                    selectedCategory != "All" &&
                    !categories.any {
                        it.equals(
                            selectedCategory,
                            ignoreCase = true
                        )
                    }
                ) {
                    selectedCategory = "All"
                }

                setupCategoryRecycler()

                applyFilters()
            }

            result.onFailure {

                promptAdapter.updateItems(
                    emptyList(),
                    false
                )

                binding.emptyText.text =
                    getString(R.string.load_failed)

                binding.emptyText.visibility =
                    View.VISIBLE

                Toast.makeText(
                    this@MainActivity,
                    R.string.load_failed,
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    /**
     * Category horizontal RecyclerView.
     */
    private fun setupCategoryRecycler() {

        binding.categoryRecycler.layoutManager =
            LinearLayoutManager(
                this,
                LinearLayoutManager.HORIZONTAL,
                false
            )

        binding.categoryRecycler.adapter =
            CategoryAdapter(
                categories,
                selectedCategory
            ) { category ->

                selectedCategory =
                    category

                applyFilters()
            }
    }

    /**
     * Swipe left/right on Explore grid
     * to switch categories.
     */
    private fun setupCategorySwipeGesture() {

        swipeGestureDetector =
            GestureDetector(
                this,
                object :
                    GestureDetector.SimpleOnGestureListener() {

                    override fun onFling(
                        e1: MotionEvent?,
                        e2: MotionEvent,
                        velocityX: Float,
                        velocityY: Float
                    ): Boolean {

                        if (e1 == null) {
                            return false
                        }

                        val deltaX =
                            e2.x - e1.x

                        val deltaY =
                            e2.y - e1.y

                        if (
                            abs(deltaX) >
                            abs(deltaY) &&
                            abs(deltaX) > 100 &&
                            abs(velocityX) > 250
                        ) {

                            if (deltaX < 0) {

                                // Swipe left
                                // Next category
                                switchCategory(1)

                            } else {

                                // Swipe right
                                // Previous category
                                switchCategory(-1)
                            }

                            return true
                        }

                        return false
                    }
                }
            )

        binding.promptRecycler.addOnItemTouchListener(
            object : RecyclerView.OnItemTouchListener {

                override fun onInterceptTouchEvent(
                    rv: RecyclerView,
                    e: MotionEvent
                ): Boolean {

                    swipeGestureDetector.onTouchEvent(e)

                    return false
                }

                override fun onTouchEvent(
                    rv: RecyclerView,
                    e: MotionEvent
                ) {
                }

                override fun onRequestDisallowInterceptTouchEvent(
                    disallowIntercept: Boolean
                ) {
                }
            }
        )
    }

    /**
     * Switch category using swipe.
     */
    private fun switchCategory(
        direction: Int
    ) {

        if (categories.isEmpty()) {
            return
        }

        val currentIndex =
            categories.indexOf(
                selectedCategory
            ).coerceAtLeast(0)

        val newIndex =
            (
                currentIndex + direction
            ).coerceIn(
                0,
                categories.size - 1
            )

        if (newIndex == currentIndex) {
            return
        }

        selectedCategory =
            categories[newIndex]

        setupCategoryRecycler()

        binding.categoryRecycler.scrollToPosition(
            newIndex
        )

        applyFilters()
    }

    /**
     * Apply category + search filters.
     *
     * Every filter change resets pagination
     * back to PAGE_SIZE.
     */
    private fun applyFilters() {

        var filtered =
            allPrompts

        /*
         * Trending is special:
         * Show prompts that either have a Trending tag
         * or their main category is Trending.
         */
        if (
            selectedCategory.equals(
                "Trending",
                ignoreCase = true
            )
        ) {

            filtered =
                filtered.filter { prompt ->

                    prompt.tags.any { tag ->

                        tag.equals(
                            "Trending",
                            ignoreCase = true
                        )
                    } ||
                    prompt.category.equals(
                        "Trending",
                        ignoreCase = true
                    )
                }

        } else if (
            selectedCategory != "All"
        ) {

            filtered =
                filtered.filter { prompt ->

                    prompt.category.equals(
                        selectedCategory,
                        ignoreCase = true
                    )
                }
        }

        /*
         * Search title, prompt text and tags.
         */
        if (searchQuery.isNotEmpty()) {

            filtered =
                filtered.filter { prompt ->

                    prompt.title.contains(
                        searchQuery,
                        ignoreCase = true
                    ) ||

                    prompt.prompt_text.contains(
                        searchQuery,
                        ignoreCase = true
                    ) ||

                    prompt.tags.any { tag ->

                        tag.contains(
                            searchQuery,
                            ignoreCase = true
                        )
                    }
                }
        }

        filteredPrompts =
            filtered

        /*
         * Reset pagination.
         */
        visibleCount =
            ExploreGridAdapter.PAGE_SIZE

        renderVisibleList()
    }

    /**
     * Display only the currently unlocked prompts.
     */
    private fun renderVisibleList() {

        val visible =
            filteredPrompts.take(
                visibleCount
            )

        val hasMore =
            filteredPrompts.size > visibleCount

        promptAdapter.updateItems(
            visible,
            hasMore
        )

        binding.emptyText.text =
            getString(R.string.no_results)

        binding.emptyText.visibility =
            if (filteredPrompts.isEmpty()) {
                View.VISIBLE
            } else {
                View.GONE
            }
    }

    /**
     * Open prompt details.
     */
    private fun openDetail(
        prompt: Prompt
    ) {

        AdsManager.showInterstitialAlways(this) {

            val intent =
                Intent(
                    this,
                    PromptDetailActivity::class.java
                )

            intent.putExtra(
                "id",
                prompt.id
            )

            intent.putExtra(
                "title",
                prompt.title
            )

            intent.putExtra(
                "category",
                prompt.category
            )

            intent.putExtra(
                "prompt_text",
                prompt.prompt_text
            )

            intent.putExtra(
                "image_url",
                prompt.image_url
            )

            startActivity(intent)
        }
    }

    /**
     * Refresh bookmark icons when returning
     * from another screen.
     */
    override fun onResume() {

        super.onResume()

        if (::promptAdapter.isInitialized) {
            promptAdapter.notifyDataSetChanged()
        }
    }
}
