# Step 3 — Environment, Migration, and Category Slug-Fix Instructions (Prepared Only)

**Status:** Prepared for review/approval. **No production environment variables were modified, no migrations were created/applied, and no database records were changed.**

---

## 1) `.env` setup for Admin → Customer live propagation

### 1.1 Customer website (`C:\Users\Anik\Desktop\Client\Pineapple-web`, deployed e.g. `https://pineapple-client.vercel.app/`)

Ensure these are set consistently in deployment and local env as appropriate:

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://dyrptcmnmuajeizdwvic.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<existing anon key>
NEXT_PUBLIC_SITE_URL=https://pineapple-client.vercel.app
NEXT_PUBLIC_WHATSAPP_NUMBER=8801717682696

# Required for secure cache revalidation (choose one pair; both supported in code)
REVALIDATE_SECRET=<strong-random-secret>
# or
CUSTOMER_REVALIDATE_SECRET=<strong-random-secret>
```

**Notes**
- `src/app/api/revalidate/route.ts` validates `x-revalidate-secret` against `REVALIDATE_SECRET` or `CUSTOMER_REVALIDATE_SECRET`.
- Keep the secret private (server-side env only; do not expose as `NEXT_PUBLIC_*`).

### 1.2 Admin panel (`C:\Users\Anik\Desktop\admin\Adminpanel-ecom`)

Add (local `.env.local` and hosting env) so admin mutations can best-effort revalidate the storefront:

```env
# Existing Supabase vars remain unchanged (same project as customer)
NEXT_PUBLIC_SUPABASE_URL=https://dyrptcmnmuajeizdwvic.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<existing>
SUPABASE_SERVICE_ROLE_KEY=<existing>
# etc.

# Customer storefront propagation (required for live cache invalidation)
CUSTOMER_SITE_URL=https://pineapple-client.vercel.app
# or NEXT_PUBLIC_CUSTOMER_SITE_URL=https://pineapple-client.vercel.app

# Must match customer REVALIDATE_SECRET / CUSTOMER_REVALIDATE_SECRET
REVALIDATE_SECRET=<same-strong-random-secret>
# or CUSTOMER_REVALIDATE_SECRET=<same-strong-random-secret>
```

### 1.3 Verification after configuration (post-approval)

1. From admin (or curl/Postman with secret), trigger:
   - `POST https://pineapple-client.vercel.app/api/revalidate`
   - Headers: `Content-Type: application/json`, `x-revalidate-secret: <secret>`
   - Body: `{"tags":["site-content","homepage-cms","hero-banners","homepage-bottom-carousel"],"paths":["/","/shop"]}`
2. Expect `200` with `{ revalidated, tags, paths }`.
3. Perform a real admin save/publish (settings, website content, homepage CMS publish, category/product/brand/collection) and confirm:
   - DB updated correctly
   - response includes `revalidated` attempt/result (where wired)
   - customer page reflects change without manual redeploy (within cache window / after revalidation)

---

## 2) Migration requirements (inspection summary; no migrations applied)

### 2.1 Relevant existing migration files (admin repo)

- `database/migrations/010_homepage_cms_config.sql`
  - Seeds `website_content` rows: `homepage_cms_published`, `homepage_cms_draft` (ON CONFLICT upsert) with default homepage CMS config.
  - **Required if** live DB lacks these keys and you want Admin publish/draft flow to target expected rows (customer now safely falls back to defaults when missing).
- `database/migrations/011_roles_and_permissions.sql` (RBAC schema/data; separate concern)
- `database/migrations/012_remove_homepage_banner_carousel.sql`
  - Removes deprecated homepage banner carousel artifacts/storage paths; **preserves** hero/banner data in `website_content`.
  - **Run only if verified safe** against current DB objects/policies and after backup/approval.

### 2.2 Live DB observations (from prior read-only inspection)

- `website_content` keys observed: `hero_banner`, `homepage_bottom_carousel`, `social_links`, `policies`, `hero_settings`, `homepage_sections`.
- `homepage_cms_published` / `homepage_cms_draft` were **not observed** at audit time (may have changed; verify before acting).
- Core tables already exist and are in use: `business_settings`, `categories`, `products`, `product_images`, `product_variants`, `inventory`, `brands`, `collections`, `shipping_zones`, `payment_gateways_config`, etc.

### 2.3 Safe migration plan (approval required before execution)

1. **Backup / snapshot** Supabase project (or export relevant tables: `website_content`, `categories` at minimum).
2. **Pre-check (read-only):**
   - `select section_key from website_content where section_key in ('homepage_cms_published','homepage_cms_draft','homepage_sections','hero_settings','hero_banner');`
   - Confirm no conflicting custom data will be unintentionally overwritten.
3. **If missing CMS publish/draft rows:** apply only the needed parts of `010_homepage_cms_config.sql` (prefer idempotent `INSERT ... ON CONFLICT (section_key) DO UPDATE` as written) in a transaction where possible.
4. **Do not apply** `012_remove_homepage_banner_carousel.sql` unless:
   - tables/functions/policies referenced exist as expected,
   - no active dependency on removed carousel module,
   - change reviewed in staging/backup context.
5. **Post-check:** verify `homepage_cms_published` JSON shape is readable by admin/customer, publish flow works, and homepage renders with fallbacks intact.

**No automatic schema redesign proposed.** New tables/modules should only be introduced if a verified gap cannot be satisfied by existing `website_content`, `business_settings`, `categories/brands/collections/products`, SEO/services tables, etc.

---

## 3) Category slug-fix instructions (malformed data; no DB changes executed)

### 3.1 Known issue (from audit)

- `categories.slug` for **"Formal Dress"** (`id 72f625ef-aad9-490f-a9c0-7e56efd442fb`, parent men’s fashion) observed as `"/formal"` (leading slash) causing broken URL patterns like `/category//formal`.
- Frontend mitigation implemented: `src/lib/slug.ts` (`normalizeSlugPathSegment`, `categoryHref`) and normalized category link generation/resolution across header/nav/footer/home/shop/category/product surfaces.
- Admin mitigation implemented (code-only): `services/categories.service.js` now normalizes slug/name on create/update and trims leading/trailing slashes.

### 3.2 Recommended data correction (requires explicit DB-write approval)

1. **Pre-check (read-only):**
   ```sql
   select id, name, slug, parent_id
   from categories
   where slug is null or slug = '' or slug ~ '^/+' or slug ~ '/+$' or slug ~ '\s';
   ```
2. **Targeted fix for known row (example):**
   ```sql
   update categories
   set slug = 'formal', updated_at = now()
   where id = '72f625ef-aad9-490f-a9c0-7e56efd442fb' and slug = '/formal';
   ```
3. **General normalization (only after review of results):**
   - normalize to `regexp_replace(trim(slug), '^/+|/+$', '', 'g')`
   - ensure uniqueness per routing rules; resolve collisions manually (do not auto-overwrite duplicates).
4. **Post-check:** browse `/category/formal` (and affected parent/child paths), confirm links from nav/footer/shop/home resolve correctly.

### 3.3 Safety

- Do **not** run bulk updates without reviewing every affected row.
- Do **not** delete or merge categories automatically; preserve FK/product relationships.
- Revalidate `site-content`/relevant paths after approved correction.

---

## 4) Blockers / approvals needed before Step 3 execution

- Approval to set/rotate `REVALIDATE_SECRET` and `CUSTOMER_SITE_URL` in admin + customer environments.
- Approval + backup to run any `website_content` seed/migration SQL.
- Approval to execute targeted `categories.slug` data correction in Supabase.
- Confirmation of live DB state for `homepage_cms_published/draft` to avoid overwriting intentional content.
