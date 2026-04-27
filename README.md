# Program Directory CMS

A back-office CMS prototype for the **University of Florida College of Education** program directory. Replaces a manually edited page with a structured editor where each program owns a list of *degree offerings*, and each offering carries its own delivery mode (on-campus, online, hybrid).

This repo is a self-contained Vite + React app — no backend required for the demo. Edits persist to `localStorage`.

---

## Quick start

```bash
npm install
npm start
```

Then open [http://localhost:5173](http://localhost:5173) (Vite will open it automatically).

Other scripts:

- `npm run build` — production build into `dist/`
- `npm run preview` — preview the production build locally

Requires Node 18+.

---

## What problem this solves

The current backend stores delivery mode at the **program level** as an array (e.g., `["On Campus", "Online"]`). That makes it impossible for the public filter to know that, say, *Educational Leadership* offers a Ph.D. on-campus and an M.Ed. online — both modes are true at the program level, neither is tied to a specific degree.

The new schema attaches delivery mode to **each degree offering**. The smallest change that unlocks the filter behavior the editorial team actually wants.

```
Old:  Program { title, types: [On Campus, Online], programs: [{name, sublink}], published: bool, image }
New:  Program { title, category, image, status, degrees: [{ type, deliveryMode, url }] }
```

`status` replaces the old `published` boolean with a three-value lifecycle: `'draft' | 'published' | 'archived'`. The Preview shows only published programs; the Admin shows everything regardless of status. Old data with `published: bool` is auto-migrated on load.

---

## Data migration

`src/data.js` ships with the legacy data and the migration logic side-by-side. Migration runs once at module load. Per-degree delivery mode is inferred in this order:

1. **Degree name prefix** — "Online M.Ed." → online; "On-Campus B.A.E." → on-campus
2. **URL slug** — `/online-edd/` → online; `/hybrid-edd/` → hybrid; `/on-campus-phd/` → on-campus
3. **Program-level types array** — falls back to the old field if it's unambiguous (only one mode listed)
4. **Default** — on-campus, marked for editor review

About a third of the migrated offerings hit step 4 because the legacy data is genuinely ambiguous (e.g., "M.A.E." with `[On Campus, Online]`). The CMS's primary job is to let the editorial team resolve these — three clicks per row.

---

## Architecture

- **Vite 6** + **React 18** — modern, fast HMR
- **Tailwind v4** via `@tailwindcss/vite` — no PostCSS config, no `tailwind.config.js`
- **Lucide** for icons
- **localStorage** for persistence (swap for fetch when wiring to a real backend)

The whole app fits in three files:

```
src/
  App.jsx     UI + state + persistence
  data.js     Raw data + migration logic + SEED_PROGRAMS export
  index.css   Tailwind import + custom display font, animations, scrollbar
```

Two views toggleable from the header:

- **Admin** — left rail of programs, right pane editor with title, status (Draft/Published/Archived), category, description, hero image URL, and degree offerings list. Each offering is a degree type + delivery mode + URL, removable inline.
- **Preview** — public-facing directory with three filter groups (Degree Type, Program Type, Delivery Mode), search, and a **Grid / List layout toggle** in the filter bar. Filters are AND-combined; degree-type and delivery-mode filters apply at the *offering* level (a program matches if any single degree matches both).

---

## Wiring to a real backend

Replace the `localStorage` calls in `App.jsx`:

```js
// useEffect on mount → fetch instead
const r = await fetch('/api/programs')
const data = await r.json()
setPrograms(data.programs)

// auto-save → PUT/POST instead
await fetch('/api/programs', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ programs, categories }),
})
```

The shape `{ programs, categories }` matches the new schema documented in `data.js`.

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or push to GitHub and import at [vercel.com/new](https://vercel.com/new). Vite is auto-detected — no config needed. About 30 seconds to a live URL.

For a Webflow portfolio embed, deploy first, then drop an iframe pointing at the Vercel URL into a Webflow Embed component.

---

## Known gaps (deliberate, not bugs)

- **No image upload.** The image field accepts URLs only — production would integrate with the WordPress media library.
- **No auth / roles.** Status is a content lifecycle, not a permission system; production needs editor/publisher roles on top.
- **No revision history.** Production version would log edits.
- **Categories are free-text editable.** In production this is probably a controlled WordPress taxonomy.
- **Delivery-mode inference is best-effort.** About 40 of 100+ migrated offerings need editor review — that's the CMS's intended use case, not a flaw.
