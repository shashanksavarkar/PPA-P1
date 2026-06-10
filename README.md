# PPA-P1

PPA-P1 is a browser-based HTML/CSS/JavaScript practice playground. It combines a challenge prompt, Monaco-powered editor, iframe preview, captured console output, validation checklist, notes, and a creator mode for building or importing custom questions.

## Features

- Playground route at `/` with challenge navigation, editor tabs, live preview, console log capture, timer, attempts, diff view, settings, fullscreen editor, and per-challenge notes.
- Creator route at `/?mode=creator` for creating, editing, importing, exporting, and resetting challenge data.
- Challenge validation rules for DOM structure, text checks, console output, and simple interaction assertions.
- Per-challenge editor persistence in `localStorage`, with legacy current-editor keys still maintained for compatibility.
- Sandboxed iframe preview. The preview keeps `allow-same-origin` because live DOM validation reads the iframe document, and console messages are filtered by iframe source plus a per-render token.

## Setup

The normal scripts are:

```sh
npm install
npm run dev
npm run build
npm run lint
```

On this machine, the global `npm` command currently points to a missing global npm CLI path. Until that is repaired, use the local binaries directly:

```sh
.\node_modules\.bin\vite.cmd --host 127.0.0.1 --port 5173
.\node_modules\.bin\vite.cmd build
.\node_modules\.bin\eslint.cmd .
```

## Project Structure

- `src/pages/PlaygroundPage.jsx`: main learning workspace and validation flow.
- `src/pages/CreatorPage.jsx`: creator-mode shell.
- `src/components/`: editor, sidebar, output, settings, JSON inspector, and creator workspace components.
- `src/utils/`: sandbox compilation, storage helpers, rule evaluation, challenge helpers, and confetti.
- `src/constants/challenges.json`: default challenge database.
- `src/constants/ruleTypes.js`: shared validation rule type contract.

## Verification

Before handing off changes, run:

```sh
.\node_modules\.bin\eslint.cmd .
.\node_modules\.bin\vite.cmd build
```

Manual checks to cover:

- Playground loads the first challenge.
- Run, Submit, Reset, Copy, Diff, Settings, and fullscreen editor work.
- Switching challenges preserves the correct saved code and notes.
- Creator mode can create, edit, import, export, and reset questions.
- At least one sample challenge can pass validation.
