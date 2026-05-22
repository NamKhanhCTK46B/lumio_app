# Lumio UI Kit — Web app

High-fidelity, click-thru recreation of the Lumio web app. **Cosmetic only** — no real Supabase calls, no real AI. Use this as a reference for layout, spacing, type, and component behaviour.

## What's in this kit

- `index.html` — entry; loads React + Babel + all component files; renders the app shell with a view switcher.
- `components.jsx` — shared primitives: `Icon`, `Button`, `Chip`, `Card`, `Avatar`, `Logo`, etc.
- `shell.jsx` — app chrome: `Sidebar`, `Topbar`, `AppShell`.
- `screens.jsx` — the five demoed screens (`Dashboard`, `Reader`, `Speak`, `Vocab`, `Write`).
- `app.jsx` — the top-level `<App>` that wires it all together.

## Screens covered

1. **Dashboard** — daily overview: streak, words due, recent activity, suggested actions.
2. **Reader** — paste a YouTube link, see synced transcript, click words to open the vocab popup, save to deck.
3. **Speak** — pick a character, run a roleplay turn with mic button + transcript + inline corrections.
4. **Vocab** — deck list + a single deck detail with SRS review.
5. **Write** — prompt list + essay editor with live IELTS-style scoring panel and inline annotations.

## How to view

Open `index.html` directly — it's self-contained (CDN React + Babel + Google Fonts). Use the **sidebar** to switch between screens, the **theme toggle** in the topbar to flip light/dark, and tap any word in the Reader to open the word popup.

## Conventions used

- All colors come from `../../colors_and_type.css` — no raw hex in JSX.
- Icons are inline Lucide SVG paths inside one `<Icon name="…">` component (`name` is one of the registered keys in `components.jsx`).
- All `styles` objects are uniquely named per file (`shellStyles`, `screenStyles`, etc.) to avoid global collisions in Babel's transpilation.
