package com.shamiacademy.pixprompt

import android.app.Activity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide

private sealed class GridItem {
    data class PromptItem(val prompt: Prompt) : GridItem()
    object AdItem : GridItem()
}

/**
 * Grid adapter for the Explore screen. Inserts a full-width banner ad
 * after every 4 prompt cards (2 rows in the 2-column grid). Used only on
 * Explore — FavoritesActivity still uses the plain PromptAdapter.
 */
class ExploreGridAdapter(
    private val activity: Activity,
    private var prompts: List<Prompt>,
    private val isFavorite: (String) -> Boolean,
    private val onClick: (Prompt) -> Unit,
    private val onBookmarkClick: (Prompt, PromptAdapter.PromptViewHolder) -> Unit
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        const val TYPE_PROMPT = 0
        const val TYPE_AD = 1
        private const val AD_INTERVAL = 4
    }

    private var items: List<GridItem> = buildItems(prompts)

    private fun buildItems(list: List<Prompt>): List<GridItem> {
        val result = mutableListOf<GridItem>()
        list.forEachIndexed { index, prompt ->
            result.add(GridItem.PromptItem(prompt))
            if ((index + 1) % AD_INTERVAL == 0) {
                result.add(GridItem.AdItem)
            }
        }
        return result
    }

    fun updateItems(newPrompts: List<Prompt>) {
        prompts = newPrompts
        items = buildItems(newPrompts)
        notifyDataSetChanged()
    }

    override fun getItemViewType(position: Int): Int = when (items[position]) {
        is GridItem.PromptItem -> TYPE_PROMPT
        is GridItem.AdItem -> TYPE_AD
    }

    override fun getItemCount(): Int = items.size

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == TYPE_AD) {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_grid_ad, parent, false)
            AdViewHolder(view)
        } else {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_prompt, parent, false)
            PromptAdapter.PromptViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = items[position]) {
            is GridItem.PromptItem -> bindPrompt(holder as PromptAdapter.PromptViewHolder, item.prompt)
            is GridItem.AdItem -> bindAd(holder as AdViewHolder)
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

    class AdViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val container: FrameLayout = itemView as FrameLayout
        var adLoaded = false
    }
}
