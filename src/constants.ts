import { Prompt } from './types';

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

/**
 * Computes a deterministic epoch millisecond timestamp for any prompt so
 * newer posts always sort before older posts (Date by Date, Time by Time).
 */
export function getPromptTimestamp(prompt: Prompt): number {
  if (typeof prompt.timestamp === 'number' && Number.isFinite(prompt.timestamp) && prompt.timestamp > 0) {
    return prompt.timestamp;
  }
  if (prompt.created_at) {
    const parsed = Date.parse(prompt.created_at);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  // Extract 13-digit epoch timestamp from image_url or id if present (e.g. prompt_1791179340233.jpg)
  const epochMatch = `${prompt.image_url || ''} ${prompt.id || ''}`.match(/(\d{13})/);
  if (epochMatch && epochMatch[1]) {
    return Number(epochMatch[1]);
  }
  // Extract sequential prompt number (e.g. prompt_016 -> 16)
  const seqMatch = (prompt.id || '').match(/prompt_0*(\d+)$/i);
  if (seqMatch && seqMatch[1]) {
    return 1700000000000 + Number(seqMatch[1]) * 3600_000;
  }
  return 0;
}

/**
 * Sorts prompts strictly by Date & Time descending (Latest / Newest post first).
 */
export function sortPromptsLatestFirst(prompts: Prompt[]): Prompt[] {
  return [...prompts].sort((a, b) => getPromptTimestamp(b) - getPromptTimestamp(a));
}

/**
 * Formats a prompt's date/time for display in Admin Studio or Detail view.
 */
export function formatPromptDateTime(prompt: Prompt): string {
  const ts = getPromptTimestamp(prompt);
  if (!ts || ts < 1600000000000) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return '';
  }
}
