package com.shamiacademy.pixprompt

import android.app.Activity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions

private sealed class GridItem {
    data class PromptItem(val prompt: Prompt) : GridItem()
    object AdItem : GridItem()
    object LoadMoreItem : GridItem()
}

/**
 * Grid adapter for Explore & Videos screens with paginated "Load More" behavior
 * and smooth card entrance animations.
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
    private var lastAnimatedPosition = -1

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
        lastAnimatedPosition = -1
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
            is GridItem.PromptItem -> bindPrompt(holder as PromptAdapter.PromptViewHolder, item.prompt, position)
            is GridItem.AdItem -> bindAd(holder as AdViewHolder)
            is GridItem.LoadMoreItem -> bindLoadMore(holder as LoadMoreViewHolder)
        }
    }

    private fun bindPrompt(holder: PromptAdapter.PromptViewHolder, prompt: Prompt, position: Int) {
        holder.title.text = prompt.title
        holder.category.text = prompt.category

        Glide.with(holder.image.context)
            .load(prompt.image_url)
            .placeholder(R.drawable.image_placeholder)
            .error(R.drawable.image_placeholder)
            .transition(DrawableTransitionOptions.withCrossFade(250))
            .centerCrop()
            .into(holder.image)

        val favorite = isFavorite(prompt.id)
        holder.bookmark.setImageResource(
            if (favorite) R.drawable.ic_bookmark else R.drawable.ic_bookmark_border
        )

        if (position > lastAnimatedPosition) {
            holder.itemView.alpha = 0f
            holder.itemView.translationY = 24f
            holder.itemView.animate()
                .alpha(1f)
                .translationY(0f)
                .setDuration(260)
                .setInterpolator(DecelerateInterpolator())
                .start()
            lastAnimatedPosition = position
        }

        holder.itemView.setOnClickListener { onClick(prompt) }
        holder.bookmark.setOnClickListener {
            holder.bookmark.animate().scaleX(1.25f).scaleY(1.25f).setDuration(110).withEndAction {
                holder.bookmark.animate().scaleX(1f).scaleY(1f).setDuration(110).start()
            }.start()
            onBookmarkClick(prompt, holder)
        }
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
