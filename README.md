# PixPrompt Lab — AI Prompt Library

Web application migrated from **PixPrompt Lab** (`Ahtsham25/pix-prompt-lab`): browse categorized AI art prompts, tap **Generate Prompt** to reveal full prompts, copy with one tap, save favorites locally, and add new prompts via the built-in Admin Panel.

## Features

- **Explore Grid**: Horizontally scrollable category chips (`All`, `Trending`, `Cinematic`, `Fantasy`, `Portrait`, `Product`, `Nature`), live search across titles, prompt text, and tags, 2-column image cards with gradient borders, and paginated **Load More**.
- **Prompt Detail & Generate Flow**: Preview image with bookmark toggle, **Generate Prompt** button with processing state that reveals the full selectable prompt text, one-tap copy to clipboard, and quick **Try Gemini** / **Try ChatGPT** launch buttons.
- **Favorites**: Local `localStorage`-backed bookmarking with a dedicated Favorites view.
- **Admin Panel**: Built-in prompt creator with image upload that saves directly to `prompts.json` and `/images` (and optionally commits to GitHub via Personal Access Token).
- **More & Settings**: WhatsApp channel link, Play Store rating/share links, Privacy Policy view, and Ad Consent preferences.

## Running Locally

```bash
npm install
npm run dev
```

The server listens on `http://0.0.0.0:3000`.
