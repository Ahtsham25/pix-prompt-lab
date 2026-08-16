package com.shamiacademy.pixprompt

import android.app.Activity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide

private sealed class GridItem {
    data class PromptItem(val prompt: Prompt) : GridItem()
    object AdItem : GridItem()
    object LoadMoreItem : GridItem()
}

/**
 * Grid adapter for the Explore screen with paginated "Load More" behavior:
 *  - Shows only [visiblePrompts] (a slice of the full filtered list).
 *  - Inserts a full-width banner ad every AD_INTERVAL prompts.
 *  - If [hasMore] is true, a "Load More" row is appended at the end.
 *    Tapping it triggers a rewarded ad via [onLoadMoreClick]; only on
 *    successful reward does the caller extend visiblePrompts (by PAGE_SIZE)
 *    and re-submit.
 */
class ExploreGridAdapter(
    private val activity: Activity,
    private var visiblePrompts: List<Prompt>,
    private var hasMore: Boolean,
    private val isFavorite: (String) -> Boolean,
    private val onClick: (Prompt) -> Unit,
    private val onBookmarkClick: (Prompt, PromptAdapter.PromptViewHolder) -> Unit,
    private val onLoadMoreClick: () -> Unit
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        const val TYPE_PROMPT = 0
        const val TYPE_AD = 1
        const val TYPE_LOAD_MORE = 2
        const val PAGE_SIZE = 8       // how many more prompts unlock per "Load More" reward
        const val AD_INTERVAL = 4     // insert a banner ad every N prompts
    }

    private var items: List<GridItem> = buildItems(visiblePrompts, hasMore)

    private fun buildItems(prompts: List<Prompt>, more: Boolean): List<GridItem> {
        val result = mutableListOf<GridItem>()
        prompts.forEachIndexed { index, prompt ->
            result.add(GridItem.PromptItem(prompt))
            if ((index + 1) % AD_INTERVAL == 0) {
                result.add(GridItem.AdItem)
            }
        }
        if (more) {
            result.add(GridItem.LoadMoreItem)
        }
        return result
    }

    fun updateItems(newVisiblePrompts: List<Prompt>, newHasMore: Boolean) {
        visiblePrompts = newVisiblePrompts
        hasMore = newHasMore
        items = buildItems(newVisiblePrompts, newHasMore)
        notifyDataSetChanged()
    }

    override fun getItemViewType(position: Int): Int = when (items[position]) {
        is GridItem.PromptItem -> TYPE_PROMPT
        is GridItem.AdItem -> TYPE_AD
        is GridItem.LoadMoreItem -> TYPE_LOAD_MORE
    }

    override fun getItemCount(): Int = items.size

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return when (viewType) {
            TYPE_AD -> {
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_grid_ad, parent, false)
                AdViewHolder(view)
            }
            TYPE_LOAD_MORE -> {
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_load_more, parent, false)
                LoadMoreViewHolder(view)
            }
            else -> {
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_prompt, parent, false)
                PromptAdapter.PromptViewHolder(view)
            }
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = items[position]) {
            is GridItem.PromptItem -> bindPrompt(holder as PromptAdapter.PromptViewHolder, item.prompt)
            is GridItem.AdItem -> bindAd(holder as AdViewHolder)
            is GridItem.LoadMoreItem -> bindLoadMore(holder as LoadMoreViewHolder)
        }
    }

    private fun bindPrompt(holder: PromptAdapter.PromptViewHolder, prompt: Prompt) {
        holder.title.text = prompt.title
        holder.category.text = prompt.category

        Glide.with(holder.image.context)
            .load(prompt.image_url)
            .placeholder(R.drawable.image_placeholder)
            .error(R.drawable.image_placeholder)
            .centerCrop()
            .into(holder.image)

        val favorite = isFavorite(prompt.id)
        holder.bookmark.setImageResource(
            if (favorite) R.drawable.ic_bookmark else R.drawable.ic_bookmark_border
        )

        holder.itemView.setOnClickListener { onClick(prompt) }
        holder.bookmark.setOnClickListener { onBookmarkClick(prompt, holder) }
    }

    private fun bindAd(holder: AdViewHolder) {
        if (!holder.adLoaded) {
            AdsManager.loadBanner(activity, holder.container)
            holder.adLoaded = true
        }
    }

    private fun bindLoadMore(holder: LoadMoreViewHolder) {
        holder.itemView.setOnClickListener { onLoadMoreClick() }
    }

    class AdViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val container: FrameLayout = itemView as FrameLayout
        var adLoaded = false
    }

    class LoadMoreViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView)
}
