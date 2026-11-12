# MOBILE_HERO_AND_STICKY_NAV_FIX_REPORT

## Scope
- **Primary repo:** `C:\Users\Anik\Desktop\Client\Pineapple-web`
- **Admin repo:** `C:\Users\Anik\Desktop\admin\Adminpanel-ecom` (not modified)
- **Issues addressed (code-level):** (1) mobile homepage hero cropping from top, (2) mobile sticky-navbar Menu opening without visible/clickable navigation items.

## 1) Root cause — mobile hero cropping (code investigation)

**Relevant implementation:** `src/components/HeroSlider.tsx` renders per-slide images via `SmartImage` (`next/image` `fill`) with separate desktop/mobile sources:
- Desktop: `className="hidden object-cover sm:block"`
- Mobile: `className="object-cover sm:hidden"` (no explicit vertical position)
- Container: `aspect-[4/5] sm:aspect-[16/8] lg:aspect-[16/7]` with `overflow-hidden`.

**Root cause:** On mobile (`<sm`) the hero uses a tall `4/5` container with `object-cover` and default object position (center). When banner artwork’s important branding/content sits near the top, center-cropping trims the upper portion (logo/branding) to fill the container. This is a fitting/positioning issue, not missing image data; mobile-specific `mobile_image_url` is already selected when available (`mobileSrc = mobile_image_url || image_url`) with desktop fallback preserved.

## 2) Root cause — sticky navbar menu items missing (code investigation)

**Relevant implementation:**
- `src/components/HeaderNav.tsx`: sticky/fixed mobile nav bar (`fixed ... md:sticky`, animated with `translate-y-*` / `transition-transform` / `will-change-transform` when scrolled) renders `<MobileMenu cats={mobileCats} />` (same `topTree`-derived data as header).
- `src/components/MobileMenu.tsx`: button toggles local `open`; overlay and `<aside>` drawer were rendered as siblings in the same component tree with `fixed`, `z-[60]`, `h-full`, `overflow-y-auto`, and the full existing nav list (`/shop`, categories/children, cart, wishlist, track-order, account, orders) with `onClick={close}`.

**Root cause (most likely, CSS stacking/containing behavior):** The drawer/overlay used `position: fixed` but were **DOM descendants of the sticky/fixed mobile `nav`** in `HeaderNav`. That `nav` applies CSS transforms/animation properties (`transform`, `translate-y-*`, `will-change-transform`, transitions). Transformed ancestors establish a containing block/stacking context for fixed-position descendants in modern browsers, so the “fixed” menu panel can be positioned/clipped relative to the transformed nav (42px-tall bar) rather than the viewport — making navigation items appear missing/invisible while the header/close affordance may still be perceived, especially when opened after scroll. Menu items were rendered by the same component/data (not conditionally removed), and z-index/opacity logic alone did not explain the reported “only Menu heading and X” symptom as well as transform containment.

## 3) Exact files changed

| File | Change |
|---|---|
| `src/components/HeroSlider.tsx` | Mobile slide image: `object-cover sm:hidden` → `object-cover object-top sm:hidden` to bias crop toward top and keep upper branding visible. Desktop image classes/behavior unchanged. |
| `src/components/MobileMenu.tsx` | Portaled menu overlay+drawer to `document.body` via `createPortal` (client-only `portalReady` guard) so the panel is no longer trapped/clipped by transformed ancestors (sticky `HeaderNav`); preserved existing menu state, nav data/routes/links, open/close, link-click close, cart action, and scrollable `overflow-y-auto` drawer. |
| `src/components/HeaderNav.tsx` | Scoped sticky-bar menu icon color override from `[&_button]:text-white` to `[&>button]:text-white` so it targets only the trigger in the bar and does not cascade into portaled/drawer controls. Kept same `MobileMenu` usage, data, layout, and sticky behavior. |
| `MOBILE_HERO_AND_STICKY_NAV_FIX_REPORT.md` | Added (this report). |

## 4) Fixes implemented

### Issue 1 — Mobile hero
- Kept existing hero slider structure, autoplay (6500ms), dots, swipe, shutter/kenburns animations, overlay/CTA rendering, and desktop classes/layout.
- Continued using `mobile_image_url || image_url` fallback and `image_url || mobile_image_url` for desktop (no source-selection changes).
- Applied `object-top` on the **mobile-only** `<SmartImage>` to preserve the important upper portion/branding without switching to `object-contain` (avoids letterboxing/empty space risk for cover-style banners). Container/aspect-ratio and header behavior unchanged in code.

### Issue 2 — Sticky mobile menu
- **Did not** hardcode links or create a second/unrelated menu. Reused the same `MobileMenu` component and the same navigation data passed from `Header`/`HeaderNav` (`topTree` → `mobileCats`).
- Rendered overlay+drawer in a portal to escape transformed sticky-nav containment while keeping a single menu implementation/state; drawer remains `fixed`, full-height, `max-w-[85%]`, `overflow-y-auto`, `z-[60]`, with existing links/actions and close behaviors intact.
- Sticky and top-header menus both use `MobileMenu` with equivalent category data; desktop nav/mega menu, search/cart/account controls, and routes unchanged.

## 5) Responsive viewport test results (requested 320/360/375/390/430)

**NOT VERIFIED in an actual mobile/browser viewport in this session.** No interactive browser/device emulation was executed here, so I cannot truthfully confirm rendered pixels, cropping, tap targets, or menu visibility across these widths.

**Code-level expectations (unverified):**
- 320/360/375/390/430px (`<sm`): mobile hero should favor top-aligned `object-cover`, preserving upper branding better than centered crop; SHOP NOW CTA remains in existing content block; no layout/overflow changes introduced.
- Sticky nav menu (opened after scroll): portalized drawer should render relative to viewport with full nav list and scrollability, independent of sticky-nav transforms.
- Desktop (`md+`): hero uses existing desktop image/classes; desktop nav unchanged.

## 6) Desktop regression test results

- **Code:** No desktop hero classes, no desktop `HeaderNav` menu structure, and no desktop header actions modified (only a Tailwind selector narrowed in sticky mobile bar). `HeroSlider` desktop `<SmartImage>` remains `hidden object-cover sm:block`.
- **Runtime visual check:** **NOT VERIFIED** in browser.

## 7) Build results

- `npm run build` in `C:\Users\Anik\Desktop\Client\Pineapple-web`: **PASS** (Next.js build completed; routes generated, static/dynamic output as before). Re-run after `MobileMenu` portal change: **PASS**.
- Lint: not separately claimed beyond build (project lint not explicitly re-run here).

## 8) Any remaining issues / verification needed

1. **Actual mobile browser QA required:** Confirm on real/emulated devices at 320/360/375/390/430px that (a) hero top branding/logo is fully visible with acceptable composition (no unwanted gaps), (b) SHOP NOW visible/clickable, (c) no horizontal overflow, (d) sticky bar appears after scroll, (e) Menu from sticky and normal header shows all nav links, (f) links navigate and close menu, (g) menu scrolls on small heights, (h) close (X)/overlay work — **not verified here**.
2. **If specific banners still crop critical content:** `object-top` is a safe general bias; artwork-specific focal points may need per-banner/object-position support from CMS/data (not added) or adjusted mobile assets.
3. **Sticky menu root cause certainty:** Transform-containment is strongly indicated by code; confirm on affected device/browser since screenshots/environment not reproducible here.
4. **Admin repo `INVENTORY_VARIANT_PURCHASE_FIX_REPORT.md` / inventory edits:** unrelated to this task; admin working tree has pre-existing and in-progress changes outside this scope (not modified).

## Important
Issues are **not claimed fixed by code inspection alone**. Build passed, but **actual mobile browser UI verification was not performed** in this environment.
