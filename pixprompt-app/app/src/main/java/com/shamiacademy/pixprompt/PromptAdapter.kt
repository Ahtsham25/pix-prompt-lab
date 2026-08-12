package com.shamiacademy.pixprompt

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide

class PromptAdapter(
    private var items: List<Prompt>,
    private val isFavorite: (String) -> Boolean,
    private val onClick: (Prompt) -> Unit,
    private val onBookmarkClick: (Prompt, PromptViewHolder) -> Unit
) : RecyclerView.Adapter<PromptAdapter.PromptViewHolder>() {

    inner class PromptViewHolder(itemView: android.view.View) : RecyclerView.ViewHolder(itemView) {
        val image: android.widget.ImageView = itemView.findViewById(R.id.promptImage)
        val title: android.widget.TextView = itemView.findViewById(R.id.promptTitle)
        val category: android.widget.TextView = itemView.findViewById(R.id.promptCategory)
        val bookmark: android.widget.ImageButton = itemView.findViewById(R.id.bookmarkIcon)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PromptViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_prompt, parent, false)
        return PromptViewHolder(view)
    }

    override fun onBindViewHolder(holder: PromptViewHolder, position: Int) {
        val prompt = items[position]
        holder.title.text = prompt.title
        holder.category.text = prompt.category

        Glide.with(holder.image.context)
            .load(prompt.image_url)
            .placeholder(R.drawable.image_placeholder)
            .error(R.drawable.image_placeholder)
            .centerCrop()
            .into(holder.image)

        updateBookmarkIcon(holder, isFavorite(prompt.id))

        holder.itemView.setOnClickListener { onClick(prompt) }
        holder.bookmark.setOnClickListener { onBookmarkClick(prompt, holder) }
    }

    fun updateBookmarkIcon(holder: PromptViewHolder, favorite: Boolean) {
        holder.bookmark.setImageResource(
            if (favorite) R.drawable.ic_bookmark else R.drawable.ic_bookmark_border
        )
    }

    override fun getItemCount(): Int = items.size

    fun updateItems(newItems: List<Prompt>) {
        items = newItems
        notifyDataSetChanged()
    }
}
