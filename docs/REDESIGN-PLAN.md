# Find Your Name — audit and redesign plan

## Step 1 — Audit

**Repository finding:** the supplied Git checkout contained only `README.md`; there was no application source, routing, template registration, Supabase client, campaign API, analytics code, UI component library, design tokens, or schema/migrations. Existing table columns, offer response shape, RLS, and event payload structure could not be verified. The implementation therefore avoids speculative SQL/REST queries and exposes a typed adapter for the host-owned functions. The development demo is explicitly marked and is never used as a production fallback.

**Reusable elements:** none were present. React/Vite/TypeScript, campaign stages, configuration validation, a small inline SVG icon set, and the visual system are created in this repository. `@supabase/supabase-js` is included as an optional public-key client; a live host integration should continue to use its existing configured client.

## Step 2 — Visual system

**Direction:** a premium illustrated night-market storybook: warm paper surfaces, deep pine/ink, lantern amber, and restrained terracotta accents. The game illustration owns the gameplay screen; controls are quiet, compact, and outside the principal search area. A purpose-created local scene is labeled preview artwork, not a campaign default.

**Tokens:** campaign colors, title/body families, and button radius are exposed through `default_config.findYourName.theme`. Base defaults live in `src/styles.css`; validated campaign values are injected as CSS variables. Typography falls back to system sans and Georgia. Campaign-provided Google Fonts URLs are restricted to `fonts.googleapis.com`.

**Components/states:** semantic primary/secondary buttons, compact icon actions, labeled inputs, focus-visible states, dialog close controls, progress tracks, warm-paper cards, discovery badges, status feedback, reduced-motion rules, and consistent easing/radii/shadows.

## Step 3 — Journey redesign

1. **Landing:** full-bleed scene, configured campaign copy, one obvious “Find my name” action, concise privacy/time cues, and a secondary how-to action.
2. **Name entry:** focused mobile-friendly dialog/bottom sheet, trim/length validation, retained draft after close, and no analytics or public URL containing the visitor name.
3. **Search instructions:** compact scene guidance plus a focused field-guide dialog.
4. **Active search:** campaign illustration, subdued target name, dynamic target text, normalized product markers, responsive lens, keyboard/touch/pointer support, optional hint, scene pan, and a compact discovered-items rail.
5. **Product discovery:** illustrated neutral fallback, only available campaign fields, validated CTA, copyable coupon, close/continue controls, and deduplicated discovery analytics.
6. **Name found:** visually distinct success scene, private found-name badge, celebratory accents, challenge-first action, and replay.
7. **Challenge friends:** dedicated two-column completion composition, configured preview with the current canonical path, native sharing, WhatsApp, copy fallback, truthful handoff/cancellation feedback, and private-name reassurance.
8. **Replay/errors:** reset creates a fresh in-memory game; missing campaign/config/network states explain the issue and allow retry.

## Step 4 — Functional implementation

- Configuration version 1 is validated before gameplay. Each hotspot is matched to an active offer ID from the host API.
- Artwork cover-fit geometry is computed once per viewport size; hit testing shares the exact same transform. Pointer movement is frame-throttled in the scene component; the campaign/root does not rerender on every pointer event.
- Game state, found products, name-found state, and analytics deduplication are session-local.
- Share URL construction removes search strings/fragments and never adds visitor data.
- Existing campaign selection and analytics serialization are passed through the host adapter; the template does not add database tables/events.

## Step 5 — Verification

The build and typecheck are part of the final handoff. The README includes a manual desktop/mobile, input, configuration, campaign schedule/domain, product mapping, analytics, share/cancellation, privacy, and host-template regression checklist. A final live campaign test still requires the host adapter and verified source row/event types; those did not exist in this checkout.
