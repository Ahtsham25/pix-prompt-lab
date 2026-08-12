package com.shamiacademy.pixprompt

/**
 * Central place for links used across the app (WhatsApp, Privacy Policy,
 * Play Store listing). Edit these once you have your final values.
 */
object Constants {

    // wa.me link built from +923087179003 (no + or leading 0 in the URL)
    const val WHATSAPP_LINK = "https://wa.me/923087179003"

    // TODO: replace with your real Google Drive privacy policy link
    // (Drive file must be shared as "Anyone with the link can view")
    const val PRIVACY_POLICY_LINK = "https://drive.google.com/file/d/REPLACE_WITH_YOUR_FILE_ID/view"

    const val PLAY_STORE_PACKAGE = "com.shamiacademy.pixprompt"

    // Try Gemini / Try ChatGPT buttons on the prompt detail screen
    const val GEMINI_PACKAGE = "com.google.android.apps.bard"
    const val GEMINI_WEB_URL = "https://gemini.google.com/app"
    const val CHATGPT_PACKAGE = "com.openai.chatgpt"
    const val CHATGPT_WEB_URL = "https://chat.openai.com/"

    // TODO: replace with your own hosted prompts.json (GitHub raw URL,
    // your own server, etc.) — the app fetches this at runtime via
    // Retrofit, so updating this file updates the app instantly for
    // everyone, with no new APK/reinstall needed.
    const val PROMPTS_JSON_URL = "https://raw.githubusercontent.com/Ahtsham25/pix-prompt-lab/main/pixprompt-app/prompts.json"
}
