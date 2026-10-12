# Pixvid Lab — Standalone Gemini AI Admin Studio & Clean Video Prompts Section

This plan separates the Admin Panel completely from the public user app, clears the pre-filled demo items from the Videos section so you can populate it with your own prompts, and adds automatic **Gemini AI Vision Analysis** to the standalone Admin Studio so uploading any image or GIF automatically generates the **Title**, **Category**, **Prompt Text**, and **Tags**.

## User Review & Critical Decisions

> [!IMPORTANT]
> Please review the confirmed decisions below and click **Proceed** to build these updates.

- **Confirmed Decision 1 — Standalone Admin Panel Only**: All Admin tabs and links will be removed from the public user app's bottom navigation bar and settings menu. The Admin Panel will live exclusively as a separate Admin Studio (`/admin` & `admin.html`).
- **Confirmed Decision 2 — Empty Initial Videos Section**: The `video_prompts` list will be emptied (`[]`) so no image prompts are duplicated in the Videos tab. Only video prompts you publish from the Admin Studio will appear in the **Videos** tab.
- **Confirmed Decision 3 — Gemini Auto-Fill on Upload**: Uploading a preview image or GIF thumbnail in the Admin Studio will automatically trigger server-side Gemini (`gemini-3.8-flash`) image analysis and populate **Title**, **Category**, **Prompt text** (tailored for either Image generation or Google Flow Video motion), and **Tags**.
- **Confirmed Decision 4 — Preview Image / GIF Thumbnail for Video Prompts**: Video prompts use uploaded preview images or animated GIF thumbnails, keeping GitHub repository storage and Android app loading fast and reliable.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Public User App (`Pixvid Lab`)**: A clean 3-tab mobile & web experience (**Images**, **Videos**, **Favorite**) with no admin clutter. The **Videos** tab starts clean with a dedicated empty state until video prompts are added via the Admin Studio.
  2. **Standalone Admin Studio (`/admin` & `admin.html`)**: A dedicated backend/admin web app for the owner. As soon as you select **Image Prompt** or **Video Prompt (Flow)** and upload a picture/GIF, Gemini AI inspects the visual composition, lighting, subject, and style, then auto-fills the Title, Category, detailed Prompt text, and Tags—ready to save locally and push to GitHub (`Ahtsham25/pix-prompt-lab`).
- **Target Audience / Persona**:
  - **End Users**: Browse AI image prompts (Try Gemini / Try ChatGPT) and AI video prompts (Try with Google Flow) in a distraction-free interface.
  - **App Owner / Admin**: Rapidly curates and publishes new image and video prompts by simply dropping in a preview image and letting Gemini write the metadata and prompt.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - **User App Flow (`/`)**:
    - Bottom navigation features exactly 3 destinations: **Images**, **Videos**, and **Favorite**.
    - Opening **Videos** before any video prompts are added displays a clean studio empty state (`"No video prompts yet"`). Once added from the Admin Studio, video prompts appear in the 2-column grid and open with the **Try with Flow** (`https://labs.google/fx/tools/flow`) action button.
  - **Admin Studio Flow (`/admin` & `admin.html`)**:
    1. Choose **Image Prompt** or **Video Prompt (Google Flow)**.
    2. Select or drag-and-drop a preview image or GIF thumbnail.
    3. **Gemini AI Auto-Analyzer** immediately analyzes the uploaded visual and fills in:
       - **Title** (concise, descriptive studio title)
       - **Category** (matched to existing categories such as `Cinematic`, `Trending`, `Fantasy`, `Portrait`, `Product`, `Nature`)
       - **Prompt Text** (rich visual prompt for Images, or camera motion + scene dynamics prompt for Google Flow Videos)
       - **Tags** (comma-separated keywords)
    4. Review or tweak any field, or click **Regenerate with Gemini** to get a fresh variation.
    5. Click **Save & Publish** to update `prompts.json` and commit directly to GitHub.
- **Visual Identity & Theme**:
  - **Aesthetic Direction**: Dark obsidian creative studio (`#07070E`) with faded glowing radial light blooms (magenta, cyan, and violet) behind frosted-glass panels (`backdrop-blur-xl`).
  - **Typography**: `Outfit` for display headers and `Plus Jakarta Sans` for crisp body copy and form controls.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Removing Admin Controls from the Public App**
  - *Chosen Approach*: Remove the 4th "Admin" tab from the user bottom navigation bar and remove "Admin Panel" from the More & Settings sheet; serve the Admin Studio at `/admin` and `/admin.html`.
  - *Why*: Regular users of the app should never see admin publishing tools, while you get a dedicated, full-featured Admin Studio URL.
- **Decision 2: Server-Side Gemini Vision Analysis with Structured JSON Schema**
  - *Chosen Approach*: Use the official `@google/genai` SDK on the Express backend (`POST /api/admin/analyze-image`) with `gemini-3.8-flash` and `responseSchema` (`Type.OBJECT`) to guarantee valid JSON output for `title`, `category`, `prompt_text`, and `tags`.
  - *Why*: Keeps `GEMINI_API_KEY` secure on the server and ensures every image upload reliably fills all four form fields in one step.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC USER APP ( / )                             │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  │
│  │  Images Tab        │  │  Videos Tab        │  │  Favorite Tab      │  │
│  │  (Gemini/ChatGPT)  │  │  (Google Flow)     │  │  (Saved Prompts)   │  │
│  └─────────┬──────────┘  └─────────┬──────────┘  └─────────┬──────────┘  │
└────────────┼───────────────────────┼───────────────────────┼─────────────┘
             │                       │                       │
             ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND SERVER (Port 3000)                   │
│  • GET  /api/prompts              ──► Reads prompts.json (video_prompts) │
│  • POST /api/prompts              ──► Saves new Image or Video prompt    │
│  • POST /api/admin/analyze-image  ──► Calls @google/genai (gemini-3.8)   │
└────────────────────────────────────▲─────────────────────────────────────┘
                                     │
┌────────────────────────────────────┴─────────────────────────────────────┐
│               STANDALONE ADMIN STUDIO ( /admin & /admin.html )           │
│  1. Select Type: [Image Prompt] or [Video Prompt (Flow)]                 │
│  2. Upload Image / GIF ──► Auto-triggers POST /api/admin/analyze-image   │
│  3. Gemini Auto-Fills: Title, Category, Prompt Text, Tags                │
│  4. Save & Sync: Updates local prompts.json + Commits to GitHub Repo     │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `prompts.json` stores `categories: string[]`, `prompts: Prompt[]` (Image Prompts), and `video_prompts: Prompt[]` (initialized to `[]`).
  - Both the root web files and synchronized Android files (`pixprompt-app/`) are updated together so the Android app also has only 3 bottom tabs (`Images`, `Videos`, `Favorite`) and clean `video_prompts`.
