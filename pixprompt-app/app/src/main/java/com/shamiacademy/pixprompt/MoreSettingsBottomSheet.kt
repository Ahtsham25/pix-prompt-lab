package com.shamiacademy.pixprompt

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

/**
 * "More & Settings" menu — WhatsApp channel, Rate Us, Share, Privacy Policy,
 * and Manage Ad Consent. Opened from the header's hamburger icon on any
 * screen that includes it.
 */
class MoreSettingsBottomSheet : BottomSheetDialogFragment() {

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        return inflater.inflate(R.layout.dialog_more_settings, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        view.findViewById<View>(R.id.closeMenuButton).setOnClickListener { dismiss() }

        view.findViewById<View>(R.id.rowWhatsapp).setOnClickListener {
            openUrl(Constants.WHATSAPP_LINK)
        }

        view.findViewById<View>(R.id.rowRate).setOnClickListener {
            openRateUs()
        }

        view.findViewById<View>(R.id.rowShare).setOnClickListener {
            shareApp()
        }

        view.findViewById<View>(R.id.rowPrivacy).setOnClickListener {
            openUrl(Constants.PRIVACY_POLICY_LINK)
        }

        view.findViewById<View>(R.id.rowAdConsent).setOnClickListener {
            activity?.let { ConsentManager.showPrivacyOptionsForm(it) }
        }
    }

    private fun openUrl(url: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (e: Exception) {
            Toast.makeText(context, "Couldn't open link", Toast.LENGTH_SHORT).show()
        }
        dismiss()
    }

    private fun openRateUs() {
        val pkg = Constants.PLAY_STORE_PACKAGE
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg")))
        } catch (e: Exception) {
            startActivity(
                Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=$pkg")
                )
            )
        }
        dismiss()
    }

    private fun shareApp() {
        val pkg = Constants.PLAY_STORE_PACKAGE
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(
                Intent.EXTRA_TEXT,
                "Check out PixPrompt Lab — a library of ready-to-use AI image prompts!\n" +
                    "https://play.google.com/store/apps/details?id=$pkg"
            )
        }
        startActivity(Intent.createChooser(shareIntent, "Share PixPrompt Lab"))
        dismiss()
    }
}
