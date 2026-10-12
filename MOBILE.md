# Mobile-first contract

Phones are the product, but the stylesheets were written desktop-first: ad-hoc
`768/769/576` boundaries, `100vh` shells that hide behind the collapsing browser
toolbars, unguarded `:hover`, and a render-blocking third-party SDK. This file is
the contract that keeps that from coming back: the tokens to reuse, the
breakpoints that are allowed, and the two guardrails that fail when the contract
is broken.

**Stage 0 (foundation) is complete.** Stage 1 (44 px hit areas) is next - see
[Next stages](#next-stages).

| Guardrail | Command | Needs |
| --- | --- | --- |
| Layout/touch audit over 8 viewports | `node scripts/mobile-audit.mjs --url http://localhost:5173` (see [guardrails](#5-guardrails) - npm drops the flag on PowerShell) | a running dev server |
| Payload budget on the built app | `npm run mobile:budget` | a prior `npm run build` |

## 1. Tokens - never hardcode these again

Defined once, in `src/index.css` (`:root` plus two `@supports` blocks).

| Token | Resolves to | Use it for |
| --- | --- | --- |
| `--vh-full` | `100dvh`, with a `100vh` fallback | any full-height shell, sheet or overlay (`height` / `min-height`) |
| `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left` | `env(safe-area-inset-*)`, `0px` fallback | fixed or absolute bars hugging an edge (capture bar, back-to-top, loader, full-screen overlays) |
| `--tap-min` | `44px` | minimum hit area - Stage 1 consumes it |

Rules:

- `index.html` **must** keep `viewport-fit=cover`. Without it every `env()` above
  resolves to `0px` and all of the notch / home-bar work silently disappears.
- Never write `100vh` in new code. Use `height: var(--vh-full)`, and when a
  literal fallback is needed put it first:
  `min-height: 100vh; min-height: var(--vh-full);`
- Never call `env()` directly. Go through `var(--safe-*)` so the insets stay
  overridable (tests, devtools, a future `?inset=` debug flag).
- Anything fixed to the bottom edge:
  `bottom: calc(<design value> + var(--safe-bottom));` - the tokens are `0px` on
  every device without insets, so desktop offsets stay exactly as designed.
- `100vw` is only allowed together with `max-width: 100%` (the
  `100vw`-plus-vertical-scrollbar overflow trap). The main shell in `Home.jsx`
  is the sanctioned example.
- Fixed, full-screen overlays use `width: 100%` (viewport-relative for a fixed
  box) - not `100vw`.

## 2. One breakpoint system

Bootstrap's, and the only one new code may use:

| Boundary | Meaning | Media query |
| --- | --- | --- |
| - | phone (base layout) | none - mobile-first |
| 576 px | `sm` | `min-width: 576px` / "below": `max-width: 575.98px` |
| 768 px | `md` | `min-width: 768px` / "below": `max-width: 767.98px` |
| 992 px | `lg` | `min-width: 992px` |
| 1200 px | `xl` | `min-width: 1200px` / "below": `max-width: 1199.98px` |

- "And up" uses `min-width: Xpx`; "and below" uses `max-width: (X - 0.02px)`, so
  no device width can match both sides of one boundary. At exactly 768 px the old
  code matched `max-width: 768px` while `min-width: 769px` had not started yet -
  a 1 px hole where neither the phone nor the desktop layout was fully applied.
- Smaller steps (`480`, `420`, `360`) are allowed as *refinements* for small
  phones, never as the primary layout switch.
- Boundaries re-mapped in Stage 0: `769 -> 768` (store scroller in `index.css`),
  `768 -> 767.98` (`App.css` x2, `index.css` x1, `styles/motion.css` x1),
  `576 -> 575.98` (`App.css` x6).
- `App.css` keeps `@media (max-width: 1100px)` for the dashboard editor grid: it
  is a genuine content breakpoint (two columns stop fitting), so it is documented
  here instead of being silently rounded to a framework value.

## 3. Touch hygiene

- `touch-action: manipulation` on every control (set once in `index.css` for
  `a`, `button`, `label`, `summary`, `input`, `select`, `textarea`,
  `[data-flash]`). It removes the 300 ms double-tap-zoom delay while keeping pan
  and pinch, so a tap scrolls or presses immediately.
- Tap feedback that the design owns (`[data-flash]`, `.mobile-top-icon`) gets
  `-webkit-tap-highlight-color: transparent`, `-webkit-touch-callout: none` and
  `user-select: none`, so only the app's own flash is visible and a long press
  cannot select an icon or raise the iOS callout.
- **All hover styling lives behind
  `@media (hover: hover) and (pointer: fine)`.** On touch, `:hover` sticks after a
  tap and leaves the tapped control looking permanently active. Stage 0 guarded
  the global `a:hover` / `button:hover` (`index.css`), the light-scheme
  `a:hover`, and the capture-bar buttons (`styles/motion.css`). New hover rules
  must be guarded too - the audit does not detect unguarded hover yet, so this one
  is on review.

## 4. Third-party SDKs load on demand

`<script src="https://appleid.cdn-apple.com/...">` used to sit in `index.html`:
a third-party DNS lookup plus its download on the critical path for every
visitor, including everyone who never taps Apple.

The SDK is now fetched by `src/utils/appleSdk.js` the first time a login button
is pressed. `loadAppleSdk()` memoises the promise, tolerates a concurrent second
tap, polls as well as listening for the script event (an already-fired script
never fires again), and gives up after 15 s so a failed load cannot hang the
button. Its callers (`Home.jsx`, `RegistrationModal.jsx`) catch the rejection and
show their own notice.

To add the next SDK: create the same memoised loader in `src/utils/`, call it from
the interaction that needs it, and check that the CSP in
`zbritje-server/server.js` already allows the origin (the Apple origin was
already allowed, so no header change was needed).

## 5. Guardrails

```
# layout + touch audit (start a dev server first)
npm run dev
node scripts/mobile-audit.mjs --url http://localhost:5173

# payload budget (start from a fresh build)
npm run build
node scripts/mobile-budget.mjs
```

**Targets.** `--url` wins, then `$AUDIT_URL`, then the first live server out of
`:5173` (dev) and `:4173` (preview). The header prints which one was used
(`[auto-detected]` vs `[--url/AUDIT_URL]`), and if nothing is listening the audit
exits 2 with instructions instead of measuring the wrong server.

**Windows/PowerShell: npm eats the flags.** `npm run mobile:audit -- --url ...`
arrives at the script with *zero* arguments (verified: the same happens to
`--json` on the budget gate), so it silently audited whatever the default was.
Call `node scripts/…` directly - or use the env-var form, which does survive npm:

```
$env:AUDIT_URL='http://localhost:5173'; npm run mobile:audit
$env:MOBILE_BUDGET_JSON='1'; npm run mobile:budget        # machine-readable
```

**Audit the dev server unless the production API is reachable.** The built bundle
calls `https://api.meniven.com/...` directly, so auditing a preview build while
that API is unreachable reports `pageerror: TypeError: Failed to fetch` at every
viewport (8 failures on 2026-10-08) and only ~10 interactive elements because no
products ever arrive - environmental, not a layout regression. The dev server
proxies the local API, so it audits the same UI with real data.

`mobile:audit` drives eight viewports (320, 360, 375, 390, 430, 768, 1024, 1440)
with real touch emulation (`hasTouch` + `isMobile` + DPR 3) and fails on:
horizontal document overflow, third-party requests on load, console errors, and a
broken click-flash on a real tap. It reports - without failing - the tap targets
below 44 px and below 24 px, plus the resolved tokens and the fixed-bar offsets,
so a regression is visible before it ships. `--json out.json` writes the same data
for diffing and `--fingerprint` prints a payload fingerprint. Playwright is
resolved from `$PW_MODULE`, then `playwright`, then the sibling
`../zbritje-server/node_modules/playwright`, so no dependency had to be added here.

`mobile:budget` reads `dist/` and fails on initial JS/CSS growth past the
regression budget (JS 215 kB gzip, CSS 40 kB gzip, one 680 kB raw chunk). It also
asserts the Apple SDK is gone from `dist/index.html`, prints the mobile-first
targets (JS 150 kB / CSS 15 kB gzip) as *not met yet*, and lists oversized static
assets as advisories.

### Measured on 2026-10-08 (Stage 0, Chromium, dev server + local API)

| Signal | Before | After |
| --- | --- | --- |
| Third-party requests on load | 1 (Apple SDK) | **0** |
| `--vh-full` / `--safe-bottom` / `--tap-min` | unset (empty) | **`100dvh` / `0px` / `44px`** |
| `touch-action` on a `[data-flash]` icon | `auto` | **`manipulation`** |
| `user-select` on a `[data-flash]` icon | `auto` | **`none`** |
| Horizontal overflow, 320 -> 1440 px | 0 px | 0 px (unchanged) |
| Flash-on-tap regression gate | pass | pass |
| Console errors | 0 | 0 |
| Initial JS | 205.37 kB gzip / 655.06 kB raw (2 chunks) | unchanged |
| Initial CSS | 37.59 kB gzip / 252.62 kB raw | unchanged (dead demo rules out, tokens in) |
| Phone viewports: elements / <44 px / <24 px | 71 / 50 / 45 | 71 / 50 / 45 (identical - Stage 0 changes no layout) |
| Tablet/desktop: elements / <44 px / <24 px | 60 / 40 / 0 | 80 / 60 / 10 (*not comparable*, see note) |

The phone rows are the meaningful comparison: identical counts before and after, so
Stage 0 moved no pixels at 320-430 px. The >=768 rows are not comparable because
the harness changed between the two captures - the post-edit audit waits for
network idle before measuring, so it sees more of the product stream, and the
`768`/`769` boundary re-mapping also applies from 768 px up. Re-baseline the
tablet rows against the current harness when Stage 1 touches that range.

Element counts depend on how much product content has streamed in, so the audit
waits for network idle before measuring; consecutive runs are then identical.
Those counts are gates, never equality against a snapshot.

## 6. What Stage 0 changed

| File | Change |
| --- | --- |
| `index.html` | `viewport-fit=cover`; Apple SDK `<script>` removed |
| `src/utils/appleSdk.js` | new on-demand, memoised Apple SDK loader |
| `src/Home.jsx` | Apple button uses the loader; shell height `var(--vh-full)`; floating loader bar `bottom: calc(... + var(--safe-bottom))` |
| `src/RegistrationModal.jsx` | Apple button uses the loader |
| `src/index.css` | token block + `@supports` fallbacks, touch hygiene, `body` dvh, hover guards, breakpoint fixes |
| `src/App.css` | `#root` / `.dashboard-page` use the tokens and safe-area padding, dead Vite demo rules (`logo`, `logo-spin`, `read-the-docs`) deleted, breakpoint fixes |
| `src/styles/motion.css` | capture bar safe-area aware, hover guards, breakpoint fix |
| `src/components/ScrollToTopButton.jsx` | safe-area aware offsets |
| `src/Dashboard.jsx` | Job Logs overlay uses `100%` + `var(--vh-full)` + safe-area padding (was `100vw` / `100vh`) |
| `src/FlyerView.jsx` | `minHeight: var(--vh-full)` |
| `scripts/mobile-audit.mjs`, `scripts/mobile-budget.mjs`, `package.json` | the two guardrails (`mobile:audit`, `mobile:budget`) |

## 7. Next stages

- **Stage 1 - 44 px hit areas.** 50 controls fall below 44 px at 390 px wide; the
  worst are the 18 x 18 "expand image" buttons on product cards (45 controls below
  24 px, i.e. under the WCAG 2.5.8 AA floor). Grow the hit area with padding or a
  pseudo-element, not by enlarging the icon.
- **Stage 1 - dead weight.** `public/mainlogo.png` (937 kB) and
  `public/mainlogo2.png` (884 kB) are referenced nowhere in `src/` (the header
  logo comes from Cloudinary), and `.card { padding: 2em }` in `App.css:53` is a
  desktop value shipped to phones.
- **Product modals.** `src/ProductModal.jsx` and `src/components/ProductModal.jsx`
  still open a fixed `100vw` x `100vh` overlay at line 181 - both are `width: 100%`
  / `height: var(--vh-full)` candidates. They were left alone in Stage 0 because
  the online-price work had those files uncommitted at the time.
- **Stage 3 - payload.** Initial JS is 205 kB gzip against a 150 kB target;
  route-splitting `/dashboard` and `/product/:id` is the lever. CSS is 37.6 kB
  against a 15 kB target, ~80% of it Bootstrap.
- **Landscape notch.** The two `width: 100vw` divs in `Dashboard.jsx` (2075, 2084,
  inside a commented block) would overflow by the inset on a notched landscape
  tablet. Harmless today; worth cleaning up when the dashboard gets its pass.

