# Find Your Name — interactive campaign template

A reusable, mobile-first hidden-object campaign experience built with React, TypeScript, and Vite. Visitors enter a name, explore an illustrated world through a magnifying glass, discover mapped campaign products, find their name, and invite friends to play a fresh session.

## Repository audit and integration boundary

The supplied checkout contained only a one-line README and the initial Git commit: there was no React app, router, template registry, campaign loader, Supabase client, analytics implementation, UI library, or database schema to inspect or reuse. The template is therefore implemented as a complete standalone frontend with an explicit host-platform adapter rather than guessing database columns, recreating platform scheduling, or silently inventing a second campaign/analytics API.

- In development without a registered host adapter, the app shows a clearly marked **local preview campaign** with illustrative sample offers and a generated market scene.
- A production build does **not** fall back to demo content. It displays a setup error until the host registers the existing campaign APIs.
- The host adapter delegates active-campaign selection, domain normalization, schedule/status rules, offer assignment, and event serialization to the platform's existing functions. No SQL migration is added because the real schema and RLS policies were not present in this checkout.

## Run the local preview

```bash
npm install
npm run dev
```

Open the Vite URL. The local preview supports the complete game flow, including name entry, pointer/touch/keyboard magnification, normalized hit testing, product discovery, coupon copy, the success screen, sharing actions, and replay. Sample offer text and coupon codes are **demo-only**; no offer is redeemed or sent to a backend.

Useful checks:

```bash
npm run typecheck
npm run build
npm run preview
```

## Connect the existing campaign platform

Register the platform functions **before rendering `<App />`**. Import the current implementations; do not reimplement their queries or schedule logic in this template.

```ts
import { registerFindYourNamePlatform } from './lib/platform';
import {
  normalizeHostname,
  fetchActiveCampaignTemplate,
  fetchActiveOffers,
  trackEvent,
} from '../existing-platform/campaign-api';
import { toExistingAnalyticsPayload } from '../existing-platform/analytics';

registerFindYourNamePlatform({
  normalizeHostname,
  fetchActiveCampaignTemplate,
  fetchActiveOffers,
  // Adapt the verified payload type expected by the existing trackEvent API.
  trackEvent: (payload) => trackEvent(payload as ExistingTrackEventPayload),
  createAnalyticsPayload: (event, context) =>
    toExistingAnalyticsPayload(event, context),
});
```

`ExistingTrackEventPayload`, module paths, and `toExistingAnalyticsPayload` above are names to replace with the real host types/helpers; they are intentionally not fabricated here. The adapter contract in `src/lib/platform.ts` is:

- `normalizeHostname(host?) → string`
- `fetchActiveCampaignTemplate(domain?) → Promise<unknown>`
- `fetchActiveOffers(domain?) → Promise<unknown>`
- `trackEvent(payload) → Promise<unknown> | unknown`
- `createAnalyticsPayload(event, context) → the payload already expected by the host's `trackEvent`

`fetchActiveCampaignTemplate` remains the authority for active setup status, campaign schedule/date boundaries, play mode, and template order. `fetchActiveOffers` remains the authority for company, branch, domain, product activity, and assigned-product ordering. The template loads both for the normalized current domain, then validates the configuration and maps the returned offers. `registerFindYourNamePlatform(...)` is also available as a window bridge at `window.__FIND_YOUR_NAME_PLATFORM__` for a host that mounts templates dynamically.

The analytics adapter only emits the existing event names: `rub_started`, `rub_abandoned`, `energy_milestone`, `reveal_shown`, `cta_click`, `coupon_copy`, and `share`. Event payload construction is delegated to the current platform serializer because its payload schema was not included. The visitor's name is never passed to analytics.

### Supabase and environment

`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are documented in `.env.example`. This isolated checkout has no existing Supabase client, so `src/lib/supabaseClient.ts` exposes one optional public-key client only when both values are set. Its custom fetch adds `apikey` while preserving request headers, including `Authorization`. It never accepts or exposes a service-role key.

When integrating into the actual campaign platform, **reuse its already-configured Supabase client and campaign APIs**; do not instantiate this optional client a second time. The template itself intentionally does not issue speculative direct table queries: the actual select/join/column names and RLS policies could not be verified from the supplied repository.

## Configure a campaign

Add a namespaced `findYourName` object to the selected template's existing `default_config`. Other `default_config` keys are left untouched. Configuration version `1` is parsed and validated in `src/config/sceneConfig.ts`.

A full sample is in [`docs/find-your-name-default-config-v1.json`](docs/find-your-name-default-config-v1.json). The required fields are:

- `version: 1`
- `scene.backgroundImage` — an HTTPS image URL or same-origin path
- `scene.width` and `scene.height` — source-art dimensions
- `scene.target` — normalized `x`, `y` from `0` to `1`; optional radius/hint/typography
- `scene.hotspots` — zero or more normalized `x`, `y` placements whose `productId` exactly matches an active offer returned by the existing offer API

Optional configuration covers campaign title/brand/logo; opening and completion copy; title/body/muted theme colors and typography; magnifier zoom and desktop/mobile lens dimensions; difficulty, hints, and discovery animation; hotspot art/symbols; modal presentation; responsive panning; and sharing message/canonical path. `sharing.message` supports `{campaign_title}` and `{campaign_url}`. Visitor names are never interpolated into the share URL or message.

### Product mapping

`src/lib/campaign.ts` retains every original offer row and the original product identifier (`sourceId`) while exposing a UI-safe normalized shape. It recognizes common field aliases for title, description, image, category, brand, coupon/offer, and CTA. The actual returned row shape was not available to inspect; after connecting the host, verify these aliases against the real `fetchActiveOffers` result and narrow/extend the mapper in one place. A hotspot that references no active offer is a campaign-configuration error, not a fabricated product.

Missing optional product data is not invented: the modal uses a neutral artwork fallback for missing images, hides missing descriptions/CTAs/coupons, and only renders CTA links with `http:` or `https:` protocols. Frontend discovery is not proof of coupon redemption.

## Architecture

- `src/lib/platform.ts` — adapter for the existing campaign/domain/analytics functions
- `src/lib/campaign.ts` — campaign loading, development demo, and offer-row normalization
- `src/lib/supabaseClient.ts` — optional public-key client for standalone adapter use
- `src/config/sceneConfig.ts` — versioned configuration parsing and validation
- `src/game/searchEngine.ts` — pure cover-fit geometry, panning bounds, and normalized hit testing
- `src/hooks/useSearchGame.ts` — session state, deduplication, discovery, progress, and analytics handoff
- `src/components/SearchScene.tsx` — magnification, responsive canvas alignment, keyboard/touch/pointer input, and scene panning
- `src/components/NameEntryModal.tsx`, `ProductRevealModal.tsx`, `VictoryScreen.tsx`, `ChallengeFriendsScreen.tsx` — complete game stages
- `src/lib/sharing.ts` — canonical URL construction, native-share content, WhatsApp encoding, and clipboard fallback
- `src/styles.css` — campaign-aware design tokens, responsive layouts, reduced-motion behavior, and shared interaction states

The background illustration in `public/images/lantern-market-demo.jpg` is local preview artwork only. Production scenes must provide their own configured image and hotspot positions.

## Accessibility and security notes

- Name input trims whitespace, rejects empty values, caps accepted names at 32 Unicode code points, supports mobile name entry, and remains in in-memory session state only.
- Modals support Escape, focus containment/restoration, visible focus, and labelled dialog semantics. The search surface supports arrow-key movement as well as pointer and touch drag.
- The interface has touch-sized actions, a mobile pan mode, reduced-motion support, and contrast-aware campaign defaults.
- Share URLs omit query strings/fragments and never contain a visitor name/session. Native share cancellation is reported as cancellation, not delivery.
- External product URLs are protocol-validated. No service-role key is read by frontend code.

## Desktop/mobile QA checklist

1. **Landing and name entry:** narrow 320–390px, tablet, and desktop; empty input, whitespace-only input, 32/33-character names, accented characters, CJK, emoji, modal close/reopen, Enter submission, and keyboard focus.
2. **Search engine:** move a mouse across each configured target; drag with touch/pen; pan the scene then search; use arrow keys; verify the lens, dynamic name, and hit areas remain aligned at desktop and portrait dimensions.
3. **Discovery:** touch each configured hotspot once; confirm one modal and one `reveal_shown` per product; close/reopen behavior, missing image/description/coupon/CTA, invalid CTA protocols, duplicate pointer events, and progress milestones.
4. **Completion:** name-found celebration, independent replay, long name wrapping/truncation, keyboard access, reduced motion, and distinct visitor sessions.
5. **Sharing:** native share available/unavailable, native share cancellation/rejection, WhatsApp encoded content, clipboard permission success/failure, actual campaign URL preview, and no visitor name in URL/message.
6. **Campaign integration:** active/inactive schedule, expired campaign, missing or malformed `default_config`, domain with `www`/port/trailing dot, multiple domains/branches, product assignment/order, RLS-denied/network failures, and exact existing analytics payloads.
7. **Regression:** run `npm run typecheck` and `npm run build`, then exercise the host's existing templates and routes after registering the adapter.

## Known integration handoff

The visual/game template and the integration contract are implemented. A true live-campaign launch still requires registering the existing APIs and confirming the real response shapes/payload serializer in the host CRM; this repository did not contain the functions or schema needed to complete that host-specific binding safely. No production database behavior is claimed for the local demo.
