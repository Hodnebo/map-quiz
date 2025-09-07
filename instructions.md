You are an expert full‑stack engineer and product designer. Build a production‑ready Oslo neighbourhood map quiz web app.

0) Objective

Create an interactive quiz game where users identify Oslo neighbourhoods (bydeler) on a map. Prioritize accuracy of boundaries, smooth gameplay, and a clean, modern UI. Ship a minimal but complete v1 with tests, docs, and deploy artifacts.

1) Deliverables

Source code for a web app (frontend + minimal backend) ready to run locally and deploy to a managed host.

Data pipeline that fetches and normalizes GeoJSON boundaries for Oslo’s administrative districts (bydeler) and optionally sub‑areas (delbydeler). Provide reproducible scripts.

Automated tests (unit + e2e).

Documentation: README with setup, dev, test, deploy; short ARCHITECTURE.md; DATA_SOURCES.md with licenses; CONTRIBUTING.md.

Design assets: lightweight style guide (colors, typography, spacing), favicon, social share image.

2) Recommended Stack (adjust if you can justify)

Frontend: React + Next.js (App Router), TypeScript, Tailwind CSS. Mapping with MapLibre GL JS (open source) or Leaflet with vector tiles.

Backend: Next.js API routes (Node 20+). No DB for v1; use static JSON for datasets and scores client‑side; provide optional server persistence via SQLite/Prisma if enabled.

Testing: Vitest for unit tests; Playwright for e2e (headless + CI).

Build/CI: pnpm workspace; GitHub Actions workflow.

Deploy: Dockerfile + docker-compose.yml; Vercel/Netlify alternative (choose one primary and provide config). Use environment variables for tile keys if needed.

3) Data Requirements

Use authoritative open data for Oslo bydeler boundaries. Output validated GeoJSON in WGS84 (EPSG:4326), polygon/multipolygon with name, bydel_number (if applicable), area_km2, and a stable id.

Include a data normalization script (scripts/fetch_oslo_geo.ts or .py) to download, validate, simplify (topo‑preserving simplification for web), and export:

/public/data/bydeler.geo.json (full precision)

/public/data/bydeler_simplified.geo.json (web‑optimized)

Compute and store centroids for label placement.

Document source URLs and license in DATA_SOURCES.md. Fail the build if license is missing.

4) Game Design (v1)

Core loop: The app prompts a random Oslo bydel name in Norwegian; user must click the matching polygon on the map.

Feedback:

Correct: polygon flashes, outline glows, name confirmed; +1 point; streak increment.

Incorrect: briefly highlight chosen polygon in red, show correct area with label, streak resets.

Rounds: Default 15 prompts; option for “All bydeler” mode.

Timer: Optional countdown per round (e.g., 10s per question). Toggle in settings.

Scoring: +1 for correct; bonus for streaks (e.g., +1 extra every 3 correct). Show final summary.

Hints: Toggleable hint reduces points for that question; hint types: show bordering districts or narrow to 3 candidates.

Difficulty:

Easy: Larger hit‑area, labels visible, hints allowed.

Normal: No labels, subtle boundary lines.

Hard: Disable hover outlines; shuffle map (no starting labels), timer on.

Modes (optional):

Learn mode: explore; click to see name, area, facts.

Speedrun: how fast can you do all bydeler?

5) UX/UI

Layout: Responsive; map dominant (left on desktop, top on mobile), right/bottom panel shows prompt, score, timer, progress.

Controls: Start/Pause/Reset; Settings (difficulty, timer, theme); Accessibility panel.

Localization: Default nb-NO; copy text to i18n/nb.json. Structure for future en-GB.

Design: Clean, Oslo‑ish palette; readable typography; focus states; high contrast mode.

Onboarding: 1‑minute guided tooltip tour.

6) Accessibility

WCAG 2.1 AA: keyboard navigation for all controls, map interactions via keyboard (tab‑focus polygons + Enter), ARIA roles/labels, sufficient color contrast, skip‑to‑content, reduced motion option.

Screen reader: announce prompts and correctness.

7) Map & Interactions

Vector tile basemap (open source) or light raster; ensure boundaries render above basemap.

Smooth pan/zoom; double‑click to zoom; reset view button.

Hit‑testing: click within polygon to answer; on hover/focus, show subtle outline (unless Hard).

Mobile: increase tap targets; prevent scroll jank.

8) Data & Logic Details

Model Bydel: { id: string; name: string; centroid: [lon, lat]; areaKm2: number; slug: string }.

Game state: finite state machine (XState or simple reducer): idle → playing → paused → ended.

Randomization: seeded RNG for reproducible quizzes; avoid immediate repeats.

Persistence: store last settings and best scores in localStorage with namespace.

9) Privacy & Telemetry

No PII. Optional privacy‑friendly analytics switch (e.g., Plausible). Provide an interface to disable.

Track events: start, answer(correct/incorrect), hint_used, end, time_per_question. Document schema.

10) Performance

Lighthouse 90+ on desktop/mobile.

Lazy‑load heavy map libs; code‑split routes; prefetch data.

Serve simplified GeoJSON (<300KB ideally) via compression.

11) Testing

Unit: reducers, scoring, RNG, data loader.

e2e: start game, answer flows (correct/incorrect), keyboard nav, mobile viewport, persistence.

Include a11y checks (axe) in CI.

12) Admin / Content (Optional v1.1)

Admin route (auth behind env‑guard) to edit copy, hint banks, and attach fun facts per bydel.

CSV import/export for content.

13) Build & DevEx

pnpm dev, pnpm test, pnpm e2e, pnpm build, pnpm start.

Prettier + ESLint; Husky pre‑commit.

Type‑safe zod validation for config and data ingestion.

14) Deployment

Provide Vercel config (if Next.js) with image optimization and headers for caching.

Provide Dockerfile (multi‑stage) and docker-compose.yml for self‑hosting.

15) Documentation

README: features, screenshots/GIFs, local setup, commands, environment variables, data refresh, troubleshooting.

ARCHITECTURE.md: component diagram, data flow, state machine, tradeoffs.

DATA_SOURCES.md: links, license text, how to regenerate.

16) Acceptance Criteria (must‑have for v1)

✅ User can start a quiz, answer 15 prompts, receive instant feedback, view final score and per‑question breakdown.

✅ Works offline after first load (PWA) and on mobile/desktop.

✅ Keyboard‑only playthrough is possible.

✅ Correct Oslo bydel boundaries rendered with hover/focus outlines (except Hard).

✅ Tests pass in CI; deploy preview produced.

17) Stretch Ideas (nice‑to‑have)

Delbydel (sub‑neighbourhood) quizzes.

Daily challenge seed; shareable result card.

Leaderboard (opt‑in, anonymous).

Audio cues; confetti on perfect score (respect reduced motion).

"Learn" cards with short facts per bydel.

18) Constraints & Assumptions

Primary audience: Norwegian users; language nb-NO.

Timezone: Europe/Oslo (used for daily seeds).

Only open data; attribute sources visibly.

19) Implementation Steps (suggested)

Scaffold Next.js+TS+Tailwind; set up lint/test/CI.

Integrate MapLibre/Leaflet; load simplified GeoJSON; render polygons with hover/click.

Implement game state machine, scoring, timer, and persistence.

Add UI panels, settings, onboarding tour, and accessibility features.

Build data fetch/simplify script and document DATA_SOURCES.

Write unit + e2e tests; wire telemetry behind a flag.

Polish, optimize, and prepare deploy artifacts.

20) API & File Structure (example)

/ (repo root)
  /app (Next.js app)
    /api
      /health/route.ts
    /game
    /components
    /styles
  /public
    /data/bydeler.geo.json
    /data/bydeler_simplified.geo.json
  /scripts/fetch_oslo_geo.ts
  /tests/unit/*.test.ts
  /tests/e2e/*.spec.ts
  README.md
  ARCHITECTURE.md
  DATA_SOURCES.md
  CONTRIBUTING.md

21) Copy (Norwegian, v1)

Start: "Start quiz"

Prompt: "Finn bydelen: {name}"

Correct: "Riktig!"

Incorrect: "Feil – korrekt bydel markert."

Score: "Poeng"

Streak: "Streak"

Timer: "Tid igjen"

End: "Ferdig! Du fikk {score} av {total}."

Buttons: "På nytt", "Pause", "Fortsett", "Innstillinger"

Difficulty: "Lett", "Normal", "Vanskelig"

22) Quality Bar

Code should be idiomatic, typed, and documented.

Passes ESLint/Prettier; zero TypeScript any in core logic.

Maintainable components; no God components >300 LOC.

23) What to Ask Back (only if truly blocking)

Provide exact data source URL if automatic discovery fails.

Confirm whether to include sub‑neighbourhoods in v1.

Confirm preferred tile provider if a key is needed.