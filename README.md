# GCP Anatomy: Deep Dive — Website Edition (v6)

Open `index.html` in a browser to play locally, or upload the entire contents of this folder to a static web host such as GitHub Pages. No Java installation, account, database or server-side code is needed.

## Session-only progress
Enter a screen name on the start screen. The dashboard tracks dives, questions played, accuracy, first-try accuracy, total depth, and performance by lecture. It accumulates during the current page session and **resets when the page reloads or closes**. No personal data is saved or uploaded. Screenshot the end-of-dive summary to retain results.

## Editing questions
Edit `data/anatomy-questions.js`. For each answer, add alternative accepted spellings/terms to its `aliases` array. Preserve distinct anatomical structures as separate answers. Save and refresh the game. The file `data/anatomy-questions.json` is a convenience copy of the current uploaded bank; the browser loads the `.js` file.

## GitHub Pages
1. Create a public GitHub repository (ensure you have permission to publish any included lecture-derived material).
2. Upload `index.html`, `css/`, `js/`, and `data/` to the repository root.
3. Under Settings → Pages, choose Deploy from a branch, `main`, `/ (root)`.
4. Share the Pages URL once published.

The source bank and game code are visible to visitors on a public website. There is no login or cloud storage.
