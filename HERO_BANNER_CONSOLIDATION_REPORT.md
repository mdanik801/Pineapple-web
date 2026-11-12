# HERO BANNER CONSOLIDATION REPORT

## Status (honest)
- **Overall:** IMPLEMENTED BUT NOT VERIFIED
- **Admin save → database → Customer Website display flow:** **NOT TESTED / BLOCKED** (no live Admin session, no live DB/storage credentials for mutation verification, no running browser/E2E in this environment). Per task requirements, this is **not claimed as completed/tested**.
- **DB migrations/production writes/env changes:** NOT PERFORMED

## 1. Duplicate Hero Management Identified (inspected)
- **A. Hero Background & Section Layout Settings** (Admin `website-content` tab “Hero Section & Background”, `website_content.hero_settings`): background color/overlay/opacity/position/size/repeat, desktop/mobile background images, heights/min/max, content/text alignment, image fit/position, desktop/mobile layout.
- **B. Homepage Hero Banner Content** (previous duplicate UI section in same tab, `website_content.hero_banner`): headline/subheadline/CTA text/link, desktop hero image, mobile hero image.
- **Overlaps:** desktop and mobile hero/background images managed in both places with separate save actions; banner-slide sync previously copied primary slide into `hero_banner` creating competing sources.
- **Customer usage (before):** `src/lib/data.ts` `getBanners()` read only `website_content.hero_banner`; `hero_settings` existed in CMS helpers but was not applied by `HeroSlider`.

## 2. Duplicate Fields/Logic Removed & Consolidation
**Removed from Admin UI/logic (properly, not CSS-hidden):**
- Duplicate **“Homepage Hero Banner Content”** section (separate card/save) removed from `app/dashboard/website-content/page.jsx`.
- Duplicate separate image upload fields for desktop/mobile in background settings replaced by a single unified “Hero Content & Images” group.
- Separate save/load flows consolidated: `loadHeroSettings()` now loads both `hero_settings` and `hero_banner`; `handleSaveHeroSettings()` now performs one unified save action writing both records.
- Removed banner-slide-to-`hero_banner` auto-sync on slide save to avoid overwriting the unified hero content/source of truth (carousel slides remain in `homepage_banners` as their own records).

**Single Admin hero management module (one UI, one save action):**
- Tab: **Website Content & CMS → Hero Section & Background** (no new module created).
- Logical groups: **Hero Content & Images** (headline, subheadline, CTA text/link, one desktop hero image, one optional mobile hero image) + **Background Colors/Overlay/Imagery controls** (color, overlay tint/opacity, position/size/repeat/custom position) + **Layout/Heights/Alignment** (height type, desktop/mobile/min/max height, content/text alignment, image fit/position, desktop split layout, mobile stacked/banner-only).
- All existing useful settings preserved and organized with clear labels.

## 3. Final Single Source of Truth
- **Primary storefront content/images record:** `website_content` key `hero_banner` (`content_data`: `headline/title`, `subheadline/subtitle`, `banner_url/image_url`, `mobile_image_url`, `cta_text`, `cta_link`, `active`).
- **Primary storefront layout/background/settings record:** `website_content` key `hero_settings` (`content_data.background`, `content_data.layout`).
- **Unified Admin save:** writes **both** records in one action and keeps `hero_settings.background.image_url/mobile_image_url` in sync with hero images for compatibility/preview consistency.
- **Carousel slides (separate existing system, not duplicated):** `homepage_banners` table/service remains intact; not used to overwrite unified `hero_banner` content. (No duplicate hero banner module created.)

## 4. Files Changed

### Admin Panel (`C:\Users\Anik\Desktop\admin\Adminpanel-ecom`)
- `app/dashboard/website-content/page.jsx` — consolidated hero UI/save/load into single unified hero management (removed duplicate Hero Banner Content section and duplicate image fields; unified headline/CTA/images + background/overlay/layout settings; single save/load; removed slide→hero sync overwrite).

### Customer Website (`C:\Users\Anik\Desktop\Client\Pineapple-web`)
- `src/lib/hero-banners.ts` — added `HeroSettings` typing and passes `settings` through normalized hero banner objects.
- `src/lib/data.ts` — `getBanners()` now fetches `hero_settings` and merges/attaches settings to `hero_banner` content for storefront consumption (cache key/version updated, tagged `hero-banners`).
- `src/components/HeroSlider.tsx` — applies unified hero settings to storefront rendering (background color, overlay color/opacity, background image/position/size/repeat for desktop/mobile, desktop/mobile heights + min/max + height type, content/text alignment, banner image fit/position, desktop split layout, mobile stacked/banner-only), while preserving Pineapple design/transitions/CTA/text and mobile full-viewport-first behavior with safe desktop fallback when mobile image empty.
- `HERO_BANNER_CONSOLIDATION_REPORT.md` — this report.

### Inspected / reused without breaking changes
- `services/website.service.js` (existing save/get for `website_content` + revalidation tags), `services/banners.service.js` (`homepage_banners` CRUD/revalidation), existing `ImageUploader`/storage flow, `src/lib/homepage-cms.ts`, `src/app/page.tsx`.

## 5. Database/Storage Structure Reused
- **Tables/keys reused:** `website_content.hero_banner`, `website_content.hero_settings`, `homepage_banners` (existing). No tables reset/truncated/recreated; no records deleted.
- **Storage:** existing image upload/storage URL flow via existing uploader/service components (no duplicate storage records intentionally created; updates target same content records).
- **No migrations prepared/applied.**

## 6. Image Upload & Image URL Functionality (code-level)
- **Desktop image:** single upload field in unified UI (`ImageUploader`) — **IMPLEMENTED BUT NOT VERIFIED**.
- **Mobile image (optional):** single upload field; empty falls back to desktop in `HeroSlider` (`mobile = mobile_image_url || image_url`, `desktop = image_url || mobile_image_url`) — **IMPLEMENTED (code) BUT NOT VERIFIED**.
- **Image URL import:** preserved if supported by existing `ImageUploader` implementation (reused component) — **IMPLEMENTED/REUSED BUT NOT VERIFIED**.
- **Previews/current saved images:** unified fields load from existing `hero_banner`/`hero_settings` records; admin preview section in page remains — **IMPLEMENTED BUT NOT VERIFIED**.
- **Correct record updates:** unified save writes `hero_banner` and `hero_settings` via existing `websiteService.saveSection` — **IMPLEMENTED BUT NOT VERIFIED**.

## 7. Customer Website Settings Coverage (wired in code)
- Desktop/mobile background images: **wired** (background layer + slide image fallbacks) — NOT VERIFIED live.
- Background color / overlay tint / overlay opacity: **wired** (section/bg and overlay layer) — NOT VERIFIED.
- Background position/size/repeat (incl. custom): **wired** — NOT VERIFIED.
- Desktop/mobile heights, min/max heights, height type (custom/auto/screen): **wired** via inline styles/responsive logic — NOT VERIFIED.
- Content alignment (vertical justification) and text alignment: **wired** — NOT VERIFIED.
- Banner image fit and position: **wired** (object-fit/position classes) — NOT VERIFIED.
- Desktop split layout / mobile stacked vs banner-only: **wired** — NOT VERIFIED.
- Headline/subheadline/CTA and CTA destination: **wired** (existing banner fields/links) — NOT VERIFIED.

*Preserved existing Pineapple design/animations/CTA styling where possible; avoided unrelated homepage redesign.*

## 8. Admin-to-Website Data Flow Test Results
**Required flow not executed:**
1. Open Admin and update desktop hero image — **NOT TESTED (BLOCKED: no admin session)**
2. Update optional mobile hero image — **NOT TESTED**
3. Change headline/subheadline/CTA — **NOT TESTED**
4. Change background/overlay/layout settings — **NOT TESTED**
5. Save and reload Admin to verify persistence — **NOT TESTED**
6. Open Customer Website and verify updated content — **NOT TESTED**
7. Test desktop/mobile responsive layouts — **N
