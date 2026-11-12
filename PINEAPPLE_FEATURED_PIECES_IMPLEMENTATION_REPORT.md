# PINEAPPLE — Featured Pieces Product Selection & Legacy Data Recovery Report

## Status Summary
- **Overall:** IMPLEMENTED BUT NOT VERIFIED
- **Admin→DB→Customer E2E:** BLOCKED (no authenticated admin session/credentials, live env/revalidation secrets/config not verifiable, no browser automation in this session)
- **Legacy DB/data migration/backfill:** REQUIRES USER APPROVAL (and live DB access) if existing Featured Pieces selections must be moved from CMS JSON into `products.is_featured`

## 1. Old Badge Functionality Removed
**Target badges removed from admin product merchandising UI and customer-facing badge behavior:** ★ Featured (product badge), 🔥 Trending, ✨ New Arrival, ⏳ Coming Soon.

### Admin Panel (source changes)
- `C:\Users\Anik\Desktop\admin\Adminpanel-ecom\app\dashboard\products\page.jsx`
  - Removed merchandising badge checkboxes/labels from Product Create/Edit form and replaced with **"Show in Homepage Featured Pieces"** (`formData.is_featured`) + preserved video/display-priority inputs.
  - Removed table merchandising pills for Trending/New/Coming Soon/Featured badge; added **"Featured Pieces"** indicator when `is_featured` and not archived.
  - Replaced product list filter tab `★ Featured` with **`Featured Pieces`** (`featured_pieces`) filtering on `is_featured`.
  - Form load/save/edit state now preserves `is_featured` as Featured Pieces selection (legacy merchandising fields no longer edited in UI).
- `C:\Users\Anik\Desktop\admin\Adminpanel-ecom\services\products.service.js`
  - Boolean sanitization retained for `is_featured` (repurposed) and legacy flags `is_trending/is_new_arrival/is_upcoming/noindex` for compatibility/safety; no UI writes for removed merchandising badges.

### Customer Website
- `C:\Users\Anik\Desktop\Client\Pineapple-web\src\components\EditorialShowcase.tsx`
  - Removed hardcoded lead-item `"Featured"` text label in Featured Pieces editorial card (section remains intact).
- `C:\Users\Anik\Desktop\Client\Pineapple-web\src\components/SearchModal.tsx`
  - Changed suggestion heading from `"Featured products"` to `"Suggested products"` (non-merchandising copy).
- `C:\Users\Anik\Desktop\Client\Pineapple-web\src\components/HeaderNav.tsx`
  - Removed `"New Arrivals"` nav link (`/shop?sort=new`) from desktop nav.
- `C:\Users\Anik\Desktop\Client\Pineapple-web\src\components/MobileMenu.tsx`
  - Removed `"New Arrivals"` mobile menu link (previously removed in working state).

**Not removed (intentional/out of scope or data-risk):**
- Homepage **"Featured pieces"** editorial section and CMS copy/config (`featured_pieces` in homepage CMS) — preserved.
- DB columns/indexes/migrations for legacy flags (`is_featured`, `is_trending`, `is_new_arrival`, `is_upcoming`, `idx_products_flags`) — **no schema/migration/DB writes performed**.
- `is_new_arrival`/`is_trending` query support in customer data layer and "New Arrivals"/trending-related copy in admin legacy homepage-sections config (`website-content` default section titles) where present — left to avoid breaking existing saved configs/behavior outside requested badge surfaces; can be cleaned in a follow-up if desired.

## 2. Product Edit Selection Implemented
- **Admin Product Create/Edit (`app/dashboard/products/page.jsx`):** added checkbox **"Show in Homepage Featured Pieces"** bound to `formData.is_featured` (persisted via existing product payload/save flow).
- Works on create and edit; existing value loaded via product fetch (`is_featured` boolean).
- Saving submits `is_featured` through existing `productsService.create/update`; unrelated edits preserve value because form initializes from loaded product state.

## 3. Existing Featured Pieces Products Discovered and Preserved
**Discovery (code/repo inspection only, read-only):**
- **Homepage CMS source:** `website_content` keys `homepage_cms_published` / `homepage_cms_draft` → `content_data.featured_pieces.product_ids`, `main_product_id`, `display_limit`, `visible` (seed/defaults in `database/migrations/010_homepage_cms_config.sql` show empty `product_ids` by default).
- **Customer fallback query (pre-existing behavior):** published non-deleted products with `is_featured = true` (`listProducts({flag:"featured"})` previously; now explicit product-level featured query).
- **Backups inspected:** `database/backups/*.json` grep showed no `featured_pieces` payloads/selected IDs in sampled backup text (repo artifacts only); **live DB state not queried in this session**.

**Preservation strategy implemented (no data loss by code path):**
- Customer homepage now treats **product-level `products.is_featured`** as primary Featured Pieces source.
- If no product-level featured products are resolved, homepage **falls back to legacy CMS `featured_pieces.product_ids`** (preserving existing CMS selections/order hints where data exists).
- If product-level selections exist and CMS IDs exist, CMS `main_product_id`/ID order are used as **order hints** (main promoted first) to reduce disruption.
- Featured Pieces section remains hidden safely when no valid products resolve; existing layout/cards/links/pricing/images preserved.

**Important:** I cannot confirm “all existing Featured Pieces products currently live in production are visible/manageable” without DB access. Legacy CMS→product flag backfill (setting `products.is_featured=true` for IDs in published/draft CMS configs) would be the durable source-of-truth alignment but **requires approval and DB write**.

## 4. Database Source of Truth
- **Implemented primary source (target):** `products.is_featured` (existing column) = product-level “Show in Homepage Featured Pieces”.
- **Homepage CMS (`website_content.homepage_cms_* .featured_pieces`):** retained for section visibility/copy/links/display limit/main/order metadata and **legacy fallback** of selected IDs; not a second independent badge system, but currently a mixed compatibility path until/unless legacy IDs are backfilled to product flags.
- **No schema changes, no migrations applied, no DB writes performed.**

## 5. Admin Files Changed
- `app/dashboard/products/page.jsx` — Product Create/Edit Featured Pieces option, table indicator/filter, removed merchandising badge UI.
- `services/products.service.js` — sanitized boolean handling comment/compatibility for repurposed `is_featured`; no merchandising UI dependency.
- *(Previously in this session/recovery context, not part of this specific feature request but present as uncommitted work):* `app/dashboard/website-content/page.jsx`, `services/banners.service.js` — banner/CMS recovery changes; preserved.

## 6. Customer Website Files Changed
- `src/app/page.tsx` — Featured Pieces data sourcing now uses product-level featured query + legacy CMS ID fallback/order hints; safe empty behavior preserved.
- `src/lib/data.ts` — added `getFeaturedPiecesProducts(limit)` (published, non-deleted, `is_featured=true`, ordered by `display_order desc, created_at desc`, filtered by in-stock via card mapping/slice); `getProductsByIds` now preserves requested ID order.
- `src/components/EditorialShowcase.tsx` — removed hardcoded “Featured” label on lead item.
- `src/components/SearchModal.tsx` — suggestion heading copy updated.
- `src/components/HeaderNav.tsx` — removed “New Arrivals” nav item.

## 7. Cache/Revalidation Changes
- **No new revalidation code added in this pass.** Existing behavior relied upon:
  - Admin `productsService.create/update/delete/restore` already triggers `triggerCustomerRevalidate({ tags: ['site-content','homepage-cms'], paths: ['/', '/shop'] })` (best-effort).
  - Customer homepage/page data uses `revalidate = 60` and tagged cached CMS/site helpers (`homepage-cms`, `site-content`, etc.); `/api/revalidate` implementation remains unchanged.
- **Note:** product-level Featured Pieces selection is read from live product queries on homepage in current implementation path; propagation still depends on successful revalidation/env configuration and cache invalidation on next valid request.

## 8. Lint/Build Results
- **Customer (`C:\Users\Anik\Desktop\Client\Pineapple-web`)**
  - `npm run lint`: **PASS**
  - `npm run build`: **PASS** (Next.js 16.4.5 production build completed successfully; routes generated including `/` dynamic)
- **Admin (`C:\Users\Anik\Desktop\admin\Adminpanel-ecom`)**
  - `node --check services/products.service.js services/homepage-cms.service.js`: **PASS**
  - `node --check app/dashboard/products/page.jsx`: **not applicable** (JSX/Next page, not plain Node script)
  - `npm run lint` / `npm run build`: **NOT RUN** (extensive pre-existing uncommitted/untracked admin work present; avoided disruptive full verification). **IMPLEMENTED BUT NOT VERIFIED**.

## 9. E2E Test Results
- **NOT RUN / BLOCKED.** No authenticated Admin login, no live DB mutation verification, no browser/device/zoom QA, and customer/admin revalidation secrets/env alignment not verified.
- Still required: discover live Featured Pieces in DB/CMS, checkbox load/save/refresh persistence, homepage reflection/ordering/display limit, zero-selection behavior, archived/unavailable exclusion, product CRUD/table/search/pagination/sort/actions regression, responsive layout checks.

## 10. Legacy Data Migration Requirements
- **REQUIRES USER APPROVAL (DB read/write/backfill):** If live `homepage_cms_published` or `homepage_cms_draft` contains `featured_pieces.product_ids/main_product_id/display_limit`, propose and (after approval) backfill to `products.is_featured` (and preserve/order hints as needed) so all existing Featured Pieces are manageable as product-level selections without loss.
- **No migration/backfill/DB write performed.** Legacy CMS IDs must not be silently discarded.
- **External/approval-gated:** `homepage_cms_published/draft` rows may be absent per prior audit; applying `010_homepage_cms_config.sql` or other migrations requires approval.

## 11. Remaining Blockers and Approval Requirements
- Live DB access + explicit approval needed for legacy selection discovery/backfill and any migration.
- Missing/unverified `CUSTOMER_SITE_URL`/`NEXT_PUBLIC_CUSTOMER_SITE_URL` and matching revalidate secrets → live propagation unverifiable.
- No authenticated admin session/credentials for UI E2E.
- Admin lint/build and full regression not executed.
- Featured Pieces admin management (`app/dashboard/featured-collections/FeaturedCollectionsManager.jsx`, `services/homepage-cms.service.js`, `/api/homepage-cms/featured-pieces/*`) still manages CMS draft `product_ids`; storefront now prefers product-level `is_featured` with legacy CMS fallback for safety. Further consolidation to a single maintained source of truth (without data loss) needs careful alignment and likely approved backfill.
- Pre-existing uncommitted admin/customer-unrelated work preserved and not reverted.

## Honest Final Status by Requirement
1. Existing Featured Pieces products discovered: **IMPLEMENTED BUT NOT VERIFIED** (code-level discovery + legacy fallback; live DB unknown)
2. Existing products manageable from Admin Panel: **IMPLEMENTED BUT NOT VERIFIED** (Product Create/Edit checkbox + table indicator/filter)
3. Product Edit checkbox loads correct state: **IMPLEMENTED BUT NOT VERIFIED**
4. Select/deselect Featured Pieces: **IMPLEMENTED BUT NOT VERIFIED**
5. Save/refresh preserve selection: **IMPLEMENTED BUT NOT VERIFIED** (existing save flow)
6. Customer Homepage reflects selection: **IMPLEMENTED BUT NOT VERIFIED**
7. Unselected products do not appear: **IMPLEMENTED BUT NOT VERIFIED**
8. Existing product order preserved where supported: **IMPLEMENTED BUT NOT VERIFIED** (CMS hints + deterministic product ordering)
9. Product cards have no old merchandising badges: **IMPLEMENTED (target surfaces) / NOT FULLY VERIFIED**
10. Homepage functional with zero selected products: **IMPLEMENTED BUT NOT VERIFIED**
11. Product management table and CRUD workflows still work: **IMPLEMENTED BUT NOT VERIFIED**
12. Desktop/mobile layouts intact: **IMPLEMENTED BUT NOT VERIFIED**


## 12. Featured Pieces Homepage Layout Fix (Customer Website)
- **Root cause:** `src/components/EditorialShowcase.tsx` used an editorial split layout: outer CSS Grid `grid gap-8 lg:grid-cols-12 lg:gap-10` with a lead card `lg:col-span-7` and a separate supporting container `lg:col-span-5` (`grid grid-cols-1 gap-y-7 md:grid-cols-2 md:gap-x-6 lg:grid-cols-1 lg:gap-y-6`). This created uneven column distribution and large blank space (especially below the lead/within the 5+7 split) depending on item count and breakpoints, so cards did not form a consistent, evenly filled grid.
- **Fix implemented:** replaced with a single consistent responsive CSS Grid for all selected products: `grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-9`. All cards render uniformly (same structure/aspect/link/image/price/hover behavior preserved), flow left-to-right, no `col-span`/`row-span`, no special editorial positioning, no absolute positioning, no unnecessary fixed heights. Grid adapts automatically to the number of selected products.
- **Responsive behavior (code):** mobile 2 columns (clean layout, no horizontal overflow expected), tablet 3 columns, desktop 4 balanced columns; standard fluid grid avoids empty tracks/spans that caused zoom/breakpoint gaps.
- **Preserved:** Featured Pieces selection logic/order/data sources, product data/DB untouched, card design/images/typography/prices/links/hover effects and Pineapple visual style, unrelated homepage sections unchanged.
- **Files changed:** `src/components/EditorialShowcase.tsx`
- **Checks:** `npm run lint` **PASS**, `npm run build` **PASS** (customer).
- **Layout inspection:** **IMPLEMENTED BUT NOT VERIFIED** in live browser/device/zoom sessions (65/75/80/100%) — not executed in this environment; requires visual QA.
