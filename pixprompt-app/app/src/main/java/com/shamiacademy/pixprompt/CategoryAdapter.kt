package com.shamiacademy.pixprompt

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class CategoryAdapter(
    private val categories: List<String>,
    private var selected: String,
    private val onSelected: (String) -> Unit
) : RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder>() {

    inner class CategoryViewHolder(val chip: TextView) : RecyclerView.ViewHolder(chip)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_category, parent, false) as TextView
        return CategoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        val category = categories[position]
        holder.chip.text = category

        val isSelected = category == selected
        holder.chip.setBackgroundResource(
            if (isSelected) R.drawable.chip_bg_selected else R.drawable.chip_bg_unselected
        )

        holder.chip.setOnClickListener {
            val previousSelected = selected
            selected = category
            notifyItemChanged(categories.indexOf(previousSelected))
            notifyItemChanged(position)
            onSelected(category)
        }
    }

    override fun getItemCount(): Int = categories.size
}
