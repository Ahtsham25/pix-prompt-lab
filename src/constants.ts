/**
 * Central place for links and constants used across Pixvid Lab
 * Mirrors Constants.kt and AdsManager.kt from the Android project.
 */
export const Constants = {
  APP_NAME: 'Pixvid Lab',
  SPLASH_TAGLINE: 'AI Image & Video Prompts, Instantly.',
  WHATSAPP_LINK: 'https://wa.me/923087179003',
  PRIVACY_POLICY_LINK: 'https://ahtsham25.github.io/pix-prompt-lab/pixprompt-app/',
  PLAY_STORE_PACKAGE: 'com.shamiacademy.pixprompt',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.shamiacademy.pixprompt',
  GEMINI_WEB_URL: 'https://gemini.google.com/app',
  CHATGPT_WEB_URL: 'https://chat.openai.com/',
  FLOW_WEB_URL: 'https://labs.google/fx/tools/flow',
  PROMPTS_JSON_URL:
    'https://raw.githubusercontent.com/Ahtsham25/pix-prompt-lab/main/pixprompt-app/prompts.json',
  PAGE_SIZE: 8,
  AD_INTERVAL: 4,
  GENERATE_DELAY_MS: 1500,
  // Preserved user AdMob IDs (matches AdsManager.kt & AndroidManifest.xml)
  ADMOB_APP_ID: 'ca-app-pub-9508264963334654~7291010658',
  BANNER_AD_UNIT_ID: 'ca-app-pub-9508264963334654/1103896314',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-9508264963334654/4851569630',
  REWARDED_AD_UNIT_ID: 'ca-app-pub-9508264963334654/8698801954',
};

/**
 * Resolves a prompt's image_url to the local /images/<filename> asset first
 * so bundled repository images load instantaneously, falling back to the remote URL.
 */
export function resolvePromptImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/images/') || url.startsWith('data:')) {
    return url;
  }
  const match = url.match(/\/images\/([^/?#]+)$/);
  if (match && match[1]) {
    return `/images/${match[1]}`;
  }
  return url;
}
