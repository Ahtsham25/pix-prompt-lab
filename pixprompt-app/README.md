# PixPrompt Lab — AI Prompt Library App

Android app clone of PixPrompt (AI image-prompt library): browse categorized
AI art prompts, tap Generate to reveal them, copy with one tap, and save
favorites. Built with the same GitHub Actions / Gradle 8.4 cloud-build
pattern used in your other Shami Academy apps — no local Android Studio
needed.

## 1. prompts.json — data format (IMPORTANT)

This is the schema the app expects. Put your real data in this exact shape.

```json
{
  "categories": ["Trending", "Portrait", "Cinematic", "Fantasy", "Product", "Nature"],
  "prompts": [
    {
      "id": "p001",
      "category": "Portrait",
      "title": "Golden Hour Portrait",
      "prompt_text": "Full prompt text goes here...",
      "image_url": "https://example.com/preview1.jpg",
      "tags": ["portrait", "golden hour", "cinematic"]
    }
  ]
}
```

Rules:
- `id` must be unique per prompt (used for bookmarking/favorites).
- `category` must exactly match one of the strings in `categories` (case-insensitive match is fine).
- `image_url` must be a **direct image link** (ends in .jpg/.png/.webp, opens
  the raw image — not a webpage/viewer link), publicly accessible without
  login. Upload your images anywhere (archive.org, your own GitHub repo,
  etc.), then just paste the direct link here.
- `tags` is optional but powers search.

**There is no bundled/offline copy of this file inside the app.** The app
fetches it fresh over the network every time (via Retrofit — see below), so
an internet connection is required to load prompts. If the request fails,
the screen shows a "couldn't load, check your connection" message instead
of a blank screen.

## 2. Where to host your prompts.json (and how the app fetches it)

1. Create a small public GitHub repo (or reuse one), e.g. `PixPromptData`.
2. Push your finished `prompts.json` to it.
3. Get the **raw** URL, e.g.:
   `https://raw.githubusercontent.com/<your-username>/PixPromptData/main/prompts.json`
4. Open `app/src/main/java/com/shamiacademy/pixprompt/Constants.kt`
   and replace the `PROMPTS_JSON_URL` constant with your raw URL.

The app uses **Retrofit** (`ApiService.kt` + `DataRepository.kt`) to call
this URL at runtime. This means: every time you edit and push a new
`prompts.json` to that repo, the app shows the update the next time it's
opened — **no new APK build, no reinstall, nothing for your users to do.**

## 3. AdMob setup (before publishing)

The app currently uses Google's official **test** ad unit IDs so it builds
and runs safely. Before you publish:

1. Create an app at https://apps.admob.com and get your **App ID**.
   Put it in `app/src/main/AndroidManifest.xml`:
   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY" />
   ```
2. Create a **Banner** ad unit and an **Interstitial** ad unit in AdMob.
3. Open `app/src/main/java/com/shamiacademy/pixprompt/AdsManager.kt` and
   replace `BANNER_AD_UNIT_ID` and `INTERSTITIAL_AD_UNIT_ID` with your real
   IDs.

Once these three values are your own, all ad revenue attributes to **your**
AdMob account.

⚠️ Never publish with the test IDs still in place — Google can suspend your
AdMob account for invalid traffic if test ads run in production.

### Getting paid
AdMob → **Payments** → add a payments profile (name/address), add your bank
account (IBAN works for Pakistan), fill the tax form (W-8BEN for non-US).
Once earnings hit **$100**, Google wires it to your bank automatically each
month (around the 21st–26th).

## 4. Menu (More & Settings)

Tap the hamburger (☰) icon in the header — on both Explore and Favorites
screens — to open the bottom sheet with:
- **Join Our WhatsApp Channel** → opens `Constants.WHATSAPP_LINK`
- **Rate Us** → opens the Play Store listing (`Constants.PLAY_STORE_PACKAGE`)
- **Share Our App** → native share sheet
- **Privacy Policy** → opens `Constants.PRIVACY_POLICY_LINK` — put your
  Google Drive doc link here (Drive file must be shared as **"Anyone with
  the link → Viewer"**, otherwise users see "access denied")
- **Manage Ad Consent** → re-opens the Google UMP consent form for users in
  regions where it's required (EEA/UK); shows a message elsewhere

All of these links live in one file:
`app/src/main/java/com/shamiacademy/pixprompt/Constants.kt`

## 5. "Generate Prompt" flow (Explore → detail screen)

1. Tap a prompt image on the Explore grid → opens the detail screen
2. Tap **Generate Prompt**
3. A short "processing" spinner shows for ~1.5s (purely cosmetic — makes it
   feel like the prompt is being generated)
4. The prompt text is revealed in a box with a **copy icon** beside it —
   tap the icon to copy to clipboard

Adjust the delay in `PromptDetailActivity.kt` (`1500L` = 1.5 seconds).

## 6. Bottom navigation

Only **two** tabs: **Explore** (home/grid) and **Favorite** (saved prompts).
There is no separate "Builder" screen/tab — it was removed.

## 7. Building via GitHub Actions

1. Push this whole folder to a new GitHub repo.
2. Go to the **Actions** tab → the `Build PixPrompt APK` workflow runs
   automatically on every push to `main` (or trigger it manually via
   "Run workflow"). This builds a **debug APK** for testing on your own
   phone.
3. When it finishes, open the workflow run → **Artifacts** →
   download `PixPrompt-debug-apk`.
4. That's your installable `app-debug.apk`.

## 7b. Building the signed release AAB for Play Store

Play Store no longer accepts plain APKs for new apps — it requires a
**signed `.aab` (Android App Bundle)**. A separate workflow handles this:
`.github/workflows/build-release-aab.yml`.

**One-time setup:**

1. A signing keystore (`pixprompt-release.jks`) was generated for you —
   download it and **back it up somewhere safe** (e.g. your own Google
   Drive, a USB drive). If you ever lose this file, you can **never update
   this app on Play Store again** — you'd have to publish it as a brand
   new app. Never commit this file to your GitHub repo (it must stay a
   secret).

2. In your GitHub repo, go to **Settings → Secrets and variables →
   Actions → New repository secret**, and add these four secrets:

   | Secret name | Value |
   |---|---|
   | `KEYSTORE_BASE64` | the base64 text of the keystore (given to you separately) |
   | `KEYSTORE_PASSWORD` | `PixPrompt@2026Lab` |
   | `KEY_ALIAS` | `pixprompt` |
   | `KEY_PASSWORD` | `PixPrompt@2026Lab` |

   (You can change these passwords by generating your own keystore with
   `keytool` if you prefer — just update the secrets to match.)

**Every time you want a new release build:**

1. Go to the **Actions** tab → **Build Signed Release AAB (Play Store)** →
   **Run workflow**.
2. When it finishes → open the run → **Artifacts** → download
   `PixPrompt-release-aab`.
3. Upload that `.aab` file to Play Console (Production/Testing track).

**Before each new release**, bump `versionCode` (and usually `versionName`)
in `app/build.gradle` — Play Store rejects an upload with the same
`versionCode` as a previous release.


## 8. What's included

- Category tabs (horizontally scrollable, driven by your JSON's `categories`)
- 2-column prompt grid, image-only cards with a gradient border + heart icon
- Live search across title / prompt text / tags
- Tap a prompt → Generate → processing spinner → reveal prompt + copy icon
- Favorite/bookmark any prompt (stored locally, no account needed)
- Dedicated **Favorites** screen with the same header + menu
- Splash screen with logo + app name
- Dark theme with multicolor (blue/purple/pink/orange) gradient accents
- AdMob banner ads (Explore screen) and interstitial ads shown periodically
- Google UMP consent form support (EEA/UK)
- "More & Settings" menu: WhatsApp, Rate Us, Share, Privacy Policy, Ad Consent
- Retrofit-based networking — prompts always fetched live, no bundled data
- Pull-to-refresh on the Explore screen

## 9. Package / app name

- `applicationId`: `com.shamiacademy.pixprompt`
- App label: `PixPrompt Lab` (change in `app/src/main/res/values/strings.xml`
  → `app_name` if you want different branding)
