package com.shamiacademy.pixprompt

/**
 * Central place for links used across the app (WhatsApp, Privacy Policy,
 * Play Store listing, Gemini, ChatGPT, and Google Flow).
 */
object Constants {

    // wa.me link built from +923087179003 (no + or leading 0 in the URL)
    const val WHATSAPP_LINK = "https://wa.me/923087179003"

    const val PRIVACY_POLICY_LINK = "https://ahtsham25.github.io/pix-prompt-lab/pixprompt-app/"

    const val PLAY_STORE_PACKAGE = "com.shamiacademy.pixprompt"

    // Try Gemini / Try ChatGPT buttons on image prompt detail screen
    const val GEMINI_PACKAGE = "com.google.android.apps.bard"
    const val GEMINI_WEB_URL = "https://gemini.google.com/app"
    const val CHATGPT_PACKAGE = "com.openai.chatgpt"
    const val CHATGPT_WEB_URL = "https://chat.openai.com/"

    // Try with Flow button on video prompt detail screen
    const val FLOW_WEB_URL = "https://labs.google/fx/tools/flow"

    const val PROMPTS_JSON_URL = "https://raw.githubusercontent.com/Ahtsham25/pix-prompt-lab/main/pixprompt-app/prompts.json"
}
