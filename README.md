# Book & Notes Vault

**Theme:** Book & Notes Vault. An accessible, responsive, framework-free catalog of books and notes with regex validation and search, stats, and local persistence.

- **Live site (GitHub Pages):** https://bbugingo-blip.github.io/<repo>/<path>/
- **Repository:** https://github.com/bbugingo-blip/<repo>
- **Demo video (unlisted):** <paste link>
- **Contact:** [bbugingo-blip](https://github.com/bbugingo-blip) · b.bugingo@alustudent.com

## Features

- Sections: About, Dashboard, Records (table on tablet/desktop, cards on mobile), Add/Edit form, Settings
- Record model: `id`, `title`, `author`, `pages`, `tag`, `dateAdded`, `createdAt`, `updatedAt`
- Add, edit (loads the row into the form) and delete with confirmation; `updatedAt` refreshed on edit
- Live regex search with a case-insensitive toggle, a safe compiler and `<mark>` highlighting
- Sorting by date added, title (A to Z / Z to A) and pages (low/high)
- Dashboard: total records, total pages, top tag, reading load in the chosen unit, a 7-day bar chart, and a page cap with ARIA live messages (polite when under the cap, assertive when over)
- Settings: page cap, display unit (pages / minutes / hours) with pages-per-minute, dark theme
- Auto-save to `localStorage`; JSON export and validated JSON import; sample data loader (`seed.json`, 12 records)

## Project structure

```
index.html     app shell
style.css      mobile-first styles
main.js        wiring: events, render pipeline
state.js       in-memory state, stats, cap and unit conversion
storage.js     localStorage, JSON export and validated import
validators.js  regex rules and field validation
search.js      safe regex compile, highlight, filter, sort
ui.js          DOM rendering
tests.js       assertions
tests.html     browser test page
seed.json      12 sample records
```

## Running locally

The app uses ES modules, so open it through a server (opening the file directly will not work). In VS Code, right-click `index.html` and choose **Open with Live Server**, or run `python -m http.server 8000` in the project folder and open http://localhost:8000.

## Running tests

Open `tests.html` through the same server. It lists every assertion as PASS or FAIL and shows a summary line ("46 of 46 tests passed").

## Regex catalog

| Use | Pattern | Example |
| --- | --- | --- |
| Title (no leading/trailing space) | `^\S(?:.*\S)?$` | `Dune` ok, ` Dune` rejected |
| Pages | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | `320`, `12.5` ok; `012`, `1.234` rejected |
| Date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` | `2024-02-29` ok; `2025-13-01` rejected (plus a real-calendar check) |
| Tag | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | `Self-help` ok; `Sci  Fi` rejected |
| Author (lookahead) | `^(?=.*[A-Za-z])(?!.*\d)\S(?:.*\S)?$` | `Ada Lovelace` ok; `R2D2` rejected |
| Duplicate word (back-reference) | `\b(\w+)\s+\1\b` | `The the Book` flagged in titles |
| ISBN (search idea) | `\b(?:97[89][- ]?)?\d{1,5}[- ]?\d+[- ]?\d+[- ]?[\dX]\b` | finds `978-0553380163` |

Useful search patterns to try: `^the`, `\b(\w+)\s+\1\b`, `\d{3,}`, `(fiction|science)`, `\bISBN\b`, `^[A-M]`. An invalid pattern such as `(` shows a message and leaves the list unchanged.

## Keyboard map

| Key | Action |
| --- | --- |
| Tab / Shift+Tab | Move between links, fields and buttons |
| Enter on "Skip to main content" | Jump past the header to the main content |
| Enter / Space | Activate buttons, the Menu toggle, Edit and Delete |
| Enter in the form | Submit (errors move focus to the first invalid field) |
| Arrow keys on a select | Change the sort order or display unit |

## Accessibility notes

- Landmarks: `header`, `nav`, `main`, `section`, `footer`; one `h1` with ordered `h2`/`h3`
- Skip link; a visible 3px focus outline on every control; 44px minimum touch targets
- Every input has a bound `<label>`; errors use `aria-describedby`, `aria-invalid` and live regions
- Status messages use `role="status"` (polite); the cap overage uses `role="alert"` (assertive)
- Search highlights use `<mark>`; user text is HTML-escaped before highlighting
- Light and dark palettes meet WCAG AA contrast; `prefers-reduced-motion` turns animation off
- Checked with the axe-core accessibility engine in light and dark themes at 360px and 1100px: no violations
- Breakpoints: base (~360px), 768px, 1024px

## Notes on data

Everything is stored in your browser's `localStorage` under `vault:records` and `vault:settings`. Import validates the structure (an array, unique ids, timestamps, and every field's regex rule) and changes nothing if any record fails.