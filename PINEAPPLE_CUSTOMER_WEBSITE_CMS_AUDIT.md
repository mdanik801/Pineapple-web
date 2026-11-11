# PINEAPPLE_CUSTOMER_WEBSITE_CMS_AUDIT

**Audit type:** Read-only audit (no files, database tables, data, UI, or configuration modified)  
**Customer website (live):** https://pineapple-client.vercel.app/ (inspected via live fetch + headers; HTTP 200 on `/`, Vercel/Next.js)  
**Repository inspected:** `C:\Users\Anik\Desktop\Client\Pineapple-web` (Next.js 16.4.5 App Router, React 19.3.0, Tailwind 4, `@supabase/supabase-js` 2.119.0, Zustand 5.1.0, `jose`)  
**Database inspected (read-only):** Supabase project `https://dyrptcmnmuajeizdwvic.supabase.co` (from `.env.local`) — table existence/counts and sampled records probed via service-role read queries only  
**Audit date:** 2026-11-11

> **Scope/limitations (stated explicitly):**
> - This repository contains the **customer-facing website only**. No Admin Panel application/source code was found in this repo (no `admin` routes/components/services). Existing Admin Panel CMS pages, mutation APIs, service functions, and end-to-end propagation (publish, active/inactive, display order, image/text updates appearing on site) **cannot be verified** here and are marked **Not verifiable in this repository**.
> - Desktop/mobile **interactive layout behavior** (runtime rendering, breakpoints, scroll/sticky behavior, cart drawer interactions, zoom 65–100%) was not fully browser-emulated in-session; findings combine live HTML/content fetches, source inspection, and prior implementation state.
> - DB schema mapping is based on read-only samples/counts and code `.select()` usage, **not** a full `information_schema` dump. Table existence is reported only where verified or explicitly probed.

---

## 1. Complete Website Page Inventory

| Route (App Router) | Source file(s) | Rendering / data source | Purpose | Visible/live-observed notes |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Server component, `revalidate = 60`; `getBanners(), getCategories(), getSettings(), getBrands(), getShippingZones(), listProducts({ flag: "featured", limit: 6 })` from `src/lib/data.ts` | Homepage | Hero slider, campaign/intro strip, categories grid, featured pieces, brand description, brands strip, bottom carousel; global header/footer/cart drawer |
| `/shop` | `src/app/shop/page.tsx`, `src/app/shop/loading.tsx` | Server; redirects to `/search` when `q` present; `Listing` + `getCategories()` | All products listing | Title, count, sort, filters (type/size/price), product grid/pagination. Live shows “Showing 95 products” |
| `/category/[slug]` | `src/app/category/[slug]/page.tsx`, `src/app/category/[slug]/loading.tsx` | Server; `getCategories()`, `descendantIds()`, `Listing`; dynamic metadata | Category/subcategory listing | Breadcrumb, category title/description, filters/grid; malformed subcategory slug observed in nav/content (`/category//formal`) |
| `/collection/[slug]` | `src/app/collection/[slug]/page.tsx` | Server; `getCollection()`, `listProducts({ collectionId, limit: 40 })` | Collection listing | Collection title/description/products; 2 active collections in DB |
| `/product/[slug]` | `src/app/product/[slug]/page.tsx` | Server; `getProductDetail()`, `getRelatedProducts()`, `getPolicies()`, `getShippingZones()`; `generateMetadata`/OG | Product details | Gallery, pricing/discount, variant selection, stock, add-to-cart/buy-now/wishlist/share, description/accordions (shipping/returns), related products |
| `/search` | `src/app/search/page.tsx` | Server; `listProducts()`, `getSizes()`, `getCategories()`, `descendantIds()`, `searchFacets()`, `searchCollections()` | Search results & facets | Products/collections tabs, query, category/availability/price/size filters, sort, pagination |
| `/cart` | `src/app/cart/page.tsx` | Client; persisted Zustand store `src/lib/store.ts` | Cart page | Client-side line items/qty/summary/checkout CTA; shipping info surfaced via layout data |
| `/checkout` | `src/app/checkout/page.tsx` | Server loads customer/zones/addresses; client `CheckoutForm` | Checkout | Order placement via `placeOrderAction` (`src/actions/order.ts`); COD/payment flow wiring |
| `/order-success/[number]` | `src/app/order-success/[number]/page.tsx` | Server; `getCustomer()` | Order confirmation | Success messaging, links to track/orders/shop |
| `/track-order` | `src/app/track-order/page.tsx` | Server form/query; `supabaseAdmin` lookup on `orders` by number+phone; `OrderView` | Guest order tracking | Phone+order number lookup, no account required |
| `/wishlist` | `src/app/wishlist/page.tsx` | Client; IDs in store, `getWishlistProducts` (`src/actions/catalog.ts`) | Wishlist | Client-persisted wishlist with fetched product cards |
| `/login` | `src/app/login/page.tsx` | Server; `AuthShell`, `LoginForm`, `loginAction` (`src/actions/auth.ts`) | Customer sign-in | Redirect if authenticated |
| `/register` | `src/app/register/page.tsx` | Server; `AuthShell`, `RegisterForm`, `registerAction` | Registration | Customer account creation |
| `/account` | `src/app/account/page.tsx`, `src/app/account/layout.tsx` | Server; auth guard via session/customer, `AccountNav` | Account dashboard/profile | Profile overview/forms |
| `/account/orders` | `src/app/account/orders/page.tsx` | Server; authenticated customer orders | Order history | List of orders |
| `/account/orders/[number]` | `src/app/account/orders/[number]/page.tsx` | Server; order detail fetch | Order detail | Status/items/payment/shipping view |
| `/account/addresses` | `src/app/account/addresses/page.tsx` | Server + actions (`src/actions/account.ts`) | Address book | Save/delete/default address management |
| `/pages/[slug]` | `src/app/pages/[slug]/page.tsx` | Server; fixed slug→title map; `getPolicies()` from `website_content.policies` | Policy/content pages | **Only supported slugs:** `about`, `shipping`, `returns`, `privacy`, `terms` |
| `/api/revalidate` | `src/app/api/revalidate/route.ts` | Route handler (POST) | On-demand cache revalidation | Secret-checked; revalidates tags `hero-banners`, `homepage-bottom-carousel`, `homepage-cms` and paths `/`, `/shop` |
| `_not-found` | `src/app/not-found.tsx` | Static/server | 404 page | Global not-found UI |

**Global/shared:** `src/app/layout.tsx` (fonts, metadata from `business_settings`), `src/app/template.tsx`, `src/app/globals.css`, `src/components/ChromeGate.tsx` wrapping `Header`, `Footer`, `CartDrawer` (outside checkout as designed).  
**Not found in repo/live inventory:** dedicated `/contact` route/page, `/about` standalone route (only `/pages/about` if policy content exists), blog, sitemap (`sitemap.ts/xml`), robots (`robots.ts/txt`), admin/CMS routes.

---

## 2. Complete Homepage Section Inventory

| # | Section | Component/file(s) | Data source (actual) | Visibility logic | Live/observed content (desktop/mobile as available) |
|---|---|---|---|---|---|
| 1 | Global header + navigation | `src/components/Header.tsx`, `HeaderNav.tsx`, `HeaderActions.tsx`, `MobileMenu.tsx`, `NavCompact.tsx`, `AnimatedLogo.tsx`, `AnimatedLogo.module.css`, `CompanySettingsLogo.tsx`, `SearchModal.tsx` | `getCategories()`, `getPopularTerms()`, `getSettings()`, session `getCustomer()` (`src/lib/data.ts`, `src/lib/session.ts`) | Rendered globally outside checkout via layout/chrome | Dual logos (Company Settings image left, HTML/animated right) in header/footer per current implementation; search, phone/account/wishlist/cart, category mega menu, mobile menu links, tagline “Step Into The Festive Season With Pineapple” present in markup/live fetch; sticky/scroll behavior implemented in client nav (not fully interactively verified) |
| 2 | Hero slider | `src/components/HeroSlider.tsx` | `getBanners()` → `website_content.section_key='hero_banner'` via `src/lib/hero-banners.ts` (tag `hero-banners`, revalidate 60) | Rendered when banners array non-empty | 2 DB-driven slides observed live (image/title/subtitle/CTA) |
| 3 | Campaign / intro strip | Inline in `src/app/page.tsx` | `banners[0]`, `business_settings.brand_name/description`, minimum active `shipping_zones.rate` | Conditional on campaign content or delivery rate | Delivery rate label, brand/title/subtitle text; several labels/copy hardcoded in component |
| 4 | Categories browse grid | Inline in `src/app/page.tsx`, `src/components/CategoryImage.tsx` | Active top-level `categories` | `topCategories.length > 0` | Headings/links like “Browse the collection / Categories / All products” hardcoded; category cards DB-driven |
| 5 | Featured pieces (editorial showcase) | `src/components/EditorialShowcase.tsx` | `listProducts({ flag: "featured", limit: 6 })` (`products.is_featured`) | `featuredProducts.length > 0` | Section labels hardcoded; featured products/prices/images DB-driven (6 items observed in source logic/live content) |
| 6 | Brand description block | Inline in `src/app/page.tsx` | `business_settings.description`, `brand_name` | If description present | Centered company/brand description |
| 7 | Brands portfolio strip | Inline in `src/app/page.tsx` | `brands` (`status='active'`, `logo_url`) | Any active brand with logo | “The label portfolio / Our brands” hardcoded; 3 brand logos DB-driven |
| 8 | Bottom carousel | `src/components/HomepageBottomCarousel.tsx`, `src/components/HeroSlider.tsx` | `getHomepageBottomCarousel()` → `website_content.section_key='homepage_bottom_carousel'` (tag `homepage-bottom-carousel`) | Active items exist | 1 active slide observed in DB/live fetch context |
| 9 | Footer | `src/components/Footer.tsx` | `getSettings()`, `getSocial()`, `getPaymentMethods()`, `getCategories()` | Global outside checkout | Contact/details/social/shop categories/account-policy links/payment methods/copyright; mix of DB-driven values and hardcoded structure/labels |
| 10 | Cart drawer | `src/components/CartDrawer.tsx`, `src/lib/store.ts` | Client Zustand store + layout shipping context | Global UI behavior | Slide-over cart with items/empty state/continue shopping |

**Stored but not rendered by live homepage:** `src/lib/homepage-cms.ts` (reads `website_content.homepage_cms_published`, tag `homepage-cms`) is unused in UI; `website_content.homepage_sections` record exists but is not consumed by customer site.

---

## 3. Header and Navigation Audit

| Element | Current website source | Data source / DB table | Existing Admin Management | Status | Required Work |
|---|---|---|---|---|---|
| Top/mobile tagline | `src/components/Header.tsx` | Hardcoded string “Step Into The Festive Season With Pineapple” | Not verifiable | **Missing (hardcoded)** | Make editable/manageable (text, visibility, device scope, scheduling) |
| Company settings logo (image) | `src/components/Header.tsx`, `src/components/CompanySettingsLogo.tsx`, `src/components/Footer.tsx` | `business_settings.company_logo` via `getSettings()` | Not verifiable | **Implemented (DB-driven)** | Verify admin upload/update propagation; alt/size controls; consistent fallback rules |
| HTML/animated logo | `src/components/AnimatedLogo.tsx`, `AnimatedLogo.module.css`, used in `Header.tsx`, `HeaderNav.tsx`, `Footer.tsx` | Component/CSS (static implementation) | Not verifiable | **Static implementation** | Decide if manageable (text/variant/asset) or keep as design system element |
| Brand/support phone | `Header.tsx`, `HeaderActions.tsx` | `business_settings.brand_name/company_name/support_phone/phone` | Not verifiable | **Partial (DB-driven)** | Ensure admin fields, formatting, click-to-call toggles |
| Main navigation categories | `Header.tsx` → `HeaderNav.tsx` (mega menu/dropdowns) | `categories` (active, hierarchy, `display_order`, `slug/name`) | Not verifiable | **Implemented (DB categories), structure fixed** | Menu builder for custom links/items, order, visibility, labels, per-device |
| “New Arrivals” nav item | `Header.tsx`, `HeaderNav.tsx`, `MobileMenu.tsx` | Hardcoded link `/shop?sort=new` | Not verifiable | **Hardcoded** | Configurable menu item/target |
| Mega menu labels | `HeaderNav.tsx` | Hardcoded (“Shop by type”, “Shop all …”) | Not verifiable | **Hardcoded** | Externalize if required |
| Mobile menu items/links | `src/components/MobileMenu.tsx` | Hardcoded list (All Products, Wishlist, Track Order, My Account, My Orders, Cart, etc.) | Not verifiable | **Hardcoded** | CMS-driven mobile menu groups/items/order/visibility |
| Search bar/category picker/placeholders | `src/components/HeaderActions.tsx`, `src/components/SearchModal.tsx`, `getPopularTerms()` | Derived popular terms + hardcoded fallback phrases; categories from DB | Not verifiable | **Partial** | Manage placeholders/behavior toggles; merchandising optional |
| Link integrity | Live nav/content, DB categories | `categories.slug` | Not verifiable | **Data issue** | Admin/import slug validation & normalization (e.g. prevent leading `/` → `/category//formal`) |

---

## 4. Product and Category Management Audit

| Element | Current website source | Database table(s) | Existing Admin Management | Status | Required Work |
|---|---|---|---|---|---|
| Categories & hierarchy | `src/lib/data.ts` (`getCategories`, `descendantIds`), `Header/Footer/page/shop/category/search` | `categories` (32 rows; `id,name,slug,description,image_url,parent_id,display_order,status`) | Not verifiable | **Implemented (DB)** | Full CRUD, status/order/image/description/SEO, slug rules, cache invalidation |
| Category listing pages | `src/app/category/[slug]/page.tsx`, `Listing.tsx` | `categories` + `products` + facets | Not verifiable | **Implemented** | SEO/banners/intro copy controls per category |
| Product catalog/cards/grid | `src/components/ProductCard.tsx`, `ProductGrid.tsx`, `Listing.tsx`, `SmartImage.tsx`, `CardAddButton.tsx`, `QuickAdd.tsx`, `src/lib/data.ts` | `products` (99), `product_images` (181), `product_variants` (667), `inventory` (751) | Not verifiable | **Implemented (DB)** | Verify admin propagation/revalidation; merchandising/badges/manual ordering where needed |
| Product detail page | `src/app/product/[slug]/page.tsx`, `src/components/ProductView.tsx`, `AddToCart.tsx` | `products`, `product_images`, `product_variants`, `inventory`, `brands`, `categories` | Not verifiable | **Implemented** | Rich content/SEO field usage, variant media, related/manual picks |
| Featured products (homepage) | `src/app/page.tsx`, `src/components/EditorialShowcase.tsx` | `products.is_featured` | Not verifiable | **Flag-driven** | Manual curation, order, section copy/CTA, limits (unused `homepage-cms` suggests `product_ids`) |
| New arrivals / trending | `listProducts` flags/sorts in `src/lib/data.ts` | `products.is_new_arrival`, `products.is_trending`, `created_at` | Not verifiable | **Implemented flags** | Admin toggles/rules/scheduling |
| Collections | `src/app/collection/[slug]/page.tsx`, search integration | `collections` (2), `products.collection_id` | Not verifiable | **Partial** | Homepage/landing surfacing, visibility/order/SEO |
| Brands | `src/app/page.tsx`, product detail | `brands` (3; `logo_url`, status, SEO/OG columns present) | Not verifiable | **Implemented** | CRUD/order/links/brand landing pages if required |
| Search & facets | `src/app/search/page.tsx`, `src/lib/data.ts`, `SearchModal.tsx` | Derived from products/categories/variants/inventory/collections | N/A | **Implemented (derived)** | Optional admin merchandising/synonyms/featured terms |
| Reviews | No review UI found | `reviews` (0) | Not verifiable | **Missing in UI** | Implement display/moderation or defer |
| Coupons/promotions | No coupon UI audited in checkout/cart | `coupons` (1) | Not verifiable | **Unknown/partial** | Confirm admin management and wire to storefront if required |

---

## 5. Contact and Footer Audit

| Element | Current website source | Database table / source | Existing Admin Management | Status | Required Work |
|---|---|---|---|---|---|
| Footer logo (company image) | `src/components/Footer.tsx` | `business_settings.company_logo` (fallback behavior in code) | Not verifiable | **Implemented (DB-driven)** | Admin upload/alt/fallback consistency; align with header branding |
| Footer animated/HTML logo (current impl) | `src/components/Footer.tsx`, `src/components/AnimatedLogo.tsx` | Component implementation | Not verifiable | **Static implementation** | Decide manageability/variant policy |
| Description, address, phone, email, hours | `src/components/Footer.tsx`, `HeaderActions.tsx` | `business_settings` (`description`, `office_address`/`address`, `support_phone`/`phone`, `support_email`/`email`, `business_hours`, etc.) | Not verifiable | **DB-driven** | Confirm full admin coverage and validation |
| Social links | `src/components/Footer.tsx` | `website_content.section_key='social_links'` via `getSocial()` | Not verifiable | **DB-driven** | CRUD/order/enable per platform, icon mapping |
| Footer shop links | `src/components/Footer.tsx` | Top-level `categories` or hardcoded fallback | Not verifiable | **Partial** | Configurable footer menu groups |
| Footer account/policy links & headings | `src/components/Footer.tsx` | Hardcoded labels/paths/column structure | Not verifiable | **Hardcoded** | CMS-managed footer menus/columns/order/visibility |
| Payment methods display | `src/components/Footer.tsx` | `payment_gateways_config` (enabled records) | Not verifiable | **DB-driven** | Naming/icon/order/display toggles |
| Copyright | `src/components/Footer.tsx` | Dynamic year/brand + hardcoded text | Not verifiable | **Partial** | Editable template |
| Contact page/form/submissions | Not present | No dedicated `contact_messages` table verified in probe | Not verifiable | **Missing** | Route, form, validation, persistence, admin inbox/notifications (migration) |
| Policy/content pages | `src/app/pages/[slug]/page.tsx` | `website_content.section_key='policies'` | Not verifiable | **DB-driven but limited** | Dynamic slugs/pages, rich text, SEO, publish/draft, menu integration |

---

## 6. Existing Database Schema Mapping

> **Note:** Column-level details inferred from read-only samples and code usage; not exhaustive.

### 6.1 Verified relevant tables

| Table | Rows (probe) | Observed/used fields | Used by |
|---|---:|---|---|
| `products` | 99 | `id,name,slug,regular_price,sale_price,cost_price,category_id,brand_id,collection_id,featured_image,status,deleted_at,is_new_arrival,is_featured,is_trending,sku,description,short_description,seo_title,seo_description,created_at` | Listings, PDP, search, featured/related, cart/order flows |
| `product_variants` | 667 | `id,product_id,sku,size,color,regular_price,sale_price,cost_price,image_url,status,created_at` | Variant selection, pricing, swatches, stock, checkout/order |
| `product_images` | 181 | `product_id,url,is_primary,display_order` | Product cards/galleries |
| `inventory` | 751 | `product_id,variant_id,current_stock,reserved_stock` | Availability/stock checks |
| `categories` | 32 | `id,name,slug,description,image_url,parent_id,display_order,status` | Header nav, footer links, home/categories, listings/filters/breadcrumbs |
| `brands` | 3 | `id,name,slug,description,logo_url,status` (+ SEO/OG-related fields present) | Homepage brands strip, PDP |
| `collections` | 2 | `id,name,slug,description,image_url,status` (+ SEO-related fields present) | Collection pages, search collections |
| `business_settings` | 2 | Branding/company/contact/metadata fields incl. `brand_name,company_name,company_logo,description,phone,support_phone,email,support_email,whatsapp,business_hours,office_address,address,browser_tab_title,...` | Layout metadata, header, footer, content blocks |
| `website_content` | 6 | `section_key,title,content_data,is_active,updated_by,updated_at` | Hero banners, bottom carousel, social links, policies (+ stored unused keys) |
| `shipping_zones` | 6 | `id,name,rate,estimated_days,is_active,free_shipping_threshold` | Delivery messaging, PDP/checkout shipping; duplicates observed in data |
| `payment_gateways_config` | 2 | `gateway_id,name,is_enabled,is_sandbox,config` | Footer payment labels, checkout/payment config |
| `customers` | 10 | Profile/auth-related fields (via actions/session usage) | Auth, account, checkout/orders |
| `customer_addresses` | 5 | Address/recipient/phone/city/zone/default/customer linkage | Checkout, account addresses |
| `orders` | 1 | Order number/status/payment/shipping/totals/customer linkage | Checkout, success, tracking, account |
| `order_items` | 1 | Line item/product/variant/qty/price fields | Order detail |
| `order_status_history` | 1 | Status transitions/timestamps | Order tracking/history |
| `payments` | 1 | Payment records | Order/payment state |
| `coupons` | 1 | (not fully sampled) | Potential promotions (not confirmed in UI) |
| `reviews` | 0 | (none) | Not used in UI |
| `admin_users` | 1 | (not sampled in detail) | Indicates external/admin system presence |

### 6.2 `website_content` keys (verified)

| `section_key` | Read by customer site | Purpose (observed) |
|---|:---:|---|
| `hero_banner` | Yes | Top homepage hero slider items |
| `homepage_bottom_carousel` | Yes | Bottom homepage carousel items |
| `social_links` | Yes | Social/contact links |
| `policies` | Yes | `about`, `shipping`, `returns`, `privacy`, `terms` content |
| `hero_settings` | No | Hero layout/background configuration (stored, unused) |
| `homepage_sections` | No | Section toggles/order/titles (stored, unused) |

### 6.3 Probed but not confirmed as existing dedicated tables

`homepage_cms_published, hero_banners, banners, menus, navigation, nav_items, pages, cms_pages, content_blocks, seo_settings, site_settings, homepage_sections` (table), `featured_products, promotions, subscribers, contact_messages, blogs, blog_posts, media, uploads, notifications` — **not verified as usable dedicated tables** in probe; current functionality is handled via `website_content` JSON and core commerce/settings tables.

---

## 7. Existing Admin Panel CMS Mapping

| Area | Admin page/component | DB table | API endpoint | Service function | Appears on site | Active/inactive | Display order | Image/text update | Verification |
|---|---|---|---|---|---|---|---|---|---|
| Header, navigation, homepage, footer, contact, SEO, products, categories, brands, collections, settings, pages | **Not found in this repository** | Relevant tables exist (e.g. `business_settings`, `website_content`, `categories`, `products`, `brands`, `collections`, `payment_gateways_config`) | Only customer-site `POST /api/revalidate` found in repo | Read-side only: `src/lib/data.ts`, `src/lib/hero-banners.ts`, `src/lib/homepage-cms.ts`, actions in `src/actions/*` | Partially (data is consumed) | Unknown | Unknown | Unknown | **Not verifiable in this repository** (separate Admin Panel required) |

**Available integration hook (customer site):** `src/app/api/revalidate/route.ts` accepts `tag`/`path` with secret validation and revalidates hero/homepage-bottom/homepage-cms tags and `/`, `/shop`; actual admin invocation, coverage, and correctness **unverified**.

---

## 8. Static/Hardcoded Content Inventory

| File | Element/content | Notes |
|---|---|---|
| `src/components/Header.tsx` | Mobile tagline “Step Into The Festive Season With Pineapple” | Hardcoded promotional text |
| `src/components/Header.tsx`, `HeaderNav.tsx`, `MobileMenu.tsx` | “New Arrivals” menu/link | Hardcoded item |
| `src/components/MobileMenu.tsx` | Mobile menu structure/labels/links (All Products, Wishlist, Track Order, My Account, My Orders, Cart) | Hardcoded |
| `src/components/HeaderNav.tsx` | Mega menu labels (“Shop by type”, “Shop all {name}”) | Hardcoded |
| `src/components/HeaderActions.tsx` | Fallback search placeholder phrases | Hardcoded |
| `src/components/NavCompact.tsx` | No-op/overlay behavior placeholder | Structural/static |
| `src/app/page.tsx` | Homepage copy/labels (“Browse the collection”, “Categories”, “All products”, delivery/intro labels) | Partly hardcoded composition |
| `src/components/EditorialShowcase.tsx` | “Selected from the collection”, “Featured pieces”, “Shop all”, “Featured” | Hardcoded |
| `src/app/page.tsx` | “The label portfolio”, “Our brands” | Hardcoded |
| `src/components/Footer.tsx` | Column headings, account/policy/shop link structures, labels/paths, fallbacks, copyright suffix | Largely hardcoded structure with some DB-driven values |
| `src/app/pages/[slug]/page.tsx` | Allowed policy slugs and title map | Hardcoded route/content mapping |
| `src/components/CheckoutForm.tsx`, `src/app/cart/page.tsx`, `src/app/track-order/page.tsx`, auth & `order-success` pages | Flow/UI copy, labels, assumptions | Hardcoded |
| `src/components/AnimatedLogo.tsx`, `AnimatedLogo.module.css`, `MobileAnimatedLogo*` | Brand mark/text/logo rendering and animation | Code-based (not CMS image) |
| `src/app/layout.tsx` | Fonts, base metadata/fallbacks | Static defaults merged with settings |
| `src/app/not-found.tsx` | 404 content | Static |

---

## 9. Missing CMS Functionality

| Area | Gap / missing capability |
|---|---|
| Admin integration | No Admin Panel in repo; create/edit/delete, enable/disable, ordering, image/text updates, and live propagation cannot be verified end-to-end |
| Header | Manageable tagline, logo configuration/variants, navigation/menu builder, device-specific content |
| Homepage composition | `homepage_cms_published` / `homepage_sections` not wired; section visibility/order/content/selection not centrally manageable |
| Hero & campaign | `hero_settings` unused; campaign strip coupled to first banner and hardcoded labels |
| Featured/categories/brands blocks | Section copy, limits, manual product/category/brand selection and ordering not fully manageable |
| Footer | Menus/groups/links/headings/copyright not fully CMS-driven |
| Content pages & SEO | Only 5 fixed policy slugs; no dynamic CMS pages, per-page SEO metadata/OG/canonical/sitemap/robots management surfaced |
| Contact | No contact page, form, submission storage, or inbox workflow |
| Mobile/desktop content control | Limited per-device asset/content management (banner mobile image only) |
| Media management | No verified customer-site media library integration |
| Data integrity | No frontend guards for invalid category slugs/duplicates (malformed `/category//formal` observed) |
| Cache/revalidation | Limited tags/paths; not aligned to all manageable entities/pages |

---

## 10. Required API and Service Changes

| Need | Exact file(s) | Required change |
|---|---|---|
| Wire homepage CMS/config | `src/app/page.tsx`, `src/lib/homepage-cms.ts`, `src/components/EditorialShowcase.tsx`, `src/components/HomepageBottomCarousel.tsx`, `src/components/HeroSlider.tsx` | Consume published/active homepage config for section visibility, order, copy, CTA, and curated selections; preserve current design |
| Configurable header/nav/footer | `src/components/Header.tsx`, `src/components/HeaderNav.tsx`, `src/components/HeaderActions.tsx`, `src/components/MobileMenu.tsx`, `src/components/NavCompact.tsx`, `src/components/Footer.tsx`, `src/app/layout.tsx` | Drive tagline, logo/branding options, menus/items, footer groups/links/copyright/social/contact from DB/CMS with safe fallbacks |
| Dynamic pages & SEO | `src/app/pages/[slug]/page.tsx`, `src/app/category/[slug]/page.tsx`, `src/app/product/[slug]/page.tsx`, `src/app/collection/[slug]/page.tsx`, `src/lib/data.ts` | Support DB-managed pages/slugs and metadata (title/description/OG/canonical/indexing) where applicable |
| CMS/data service layer | `src/lib/data.ts`, (new) `src/lib/cms.ts` (or equivalent) | Typed, cached fetchers/normalizers for menus, pages, homepage blocks, site/header/footer/SEO config |
| Revalidation strategy | `src/app/api/revalidate/route.ts`, `src/lib/data.ts`, `src/lib/hero-banners.ts`, `src/lib/homepage-cms.ts` | Expand tag/path coverage, secure admin-trigger integration, align invalidation with all managed content entities |
| Contact capability (if required) | (new) `src/app/contact/page.tsx`, form component(s), action/route handler, `src/lib/data.ts` or service module | Submission validation, persistence, user feedback, and admin-consumable storage contract |
| Robustness & data normalization | `src/lib/data.ts`, navigation components consuming categories/links | Slug normalization/guards, duplicate handling, graceful fallbacks for bad CMS data |

---

## 11. Required Database Migrations

> **Audit-only:** no migrations created or applied.

| Priority | Migration | Purpose | Suggested columns/relationships/notes |
|---:|---|---|---|
| High | Formalize homepage CMS store (`homepage_cms_published` table or strict `website_content` contract) | Publishable, versioned homepage configuration consumed by site | `id`/`key`, `content_data jsonb`, `status`/`is_published`, `version`, `published_at`, `updated_at`, `updated_by` (FK `admin_users` if applicable) |
| High | `menus` + `menu_items` | Manage header/mobile/footer/custom navigation | `location` (header/mobile/footer), `label`, `url`/`slug_ref`, `parent_id`, `sort_order`, `is_active`, `target`, `device_scope`, `metadata jsonb`, timestamps |
| High | `cms_pages`/`pages` | Dynamic content pages beyond fixed policies | `slug` (unique), `title`, `body`/`content jsonb`, `status`, `seo_title`, `seo_description`, `og_image`, `published_at`, timestamps |
| High | `contact_messages` (if contact required) | Store contact submissions for admin inbox | `id`, `name`, `email`, `phone`, `subject`, `message`, `status`, `source`, `created_at`, optional metadata |
| Medium | Extend `business_settings` or add `site_settings` | Explicit manageable global/header/footer/SEO fields | tagline, logo config/alt, footer text/copyright template, default SEO/meta fields |
| Medium | Homepage blocks normalization (if not JSON-only) | Section-level CRUD, ordering, scheduling | block/section type, content/media refs, CTA, product/category refs, visibility, `sort_order`, schedule fields |
| Medium | Data integrity/cleanup migration | Fix observed issues and prevent recurrence | normalize category slugs (remove leading `/`), dedupe `shipping_zones`, unique/validation constraints/indexes |
| Low | `media`/asset registry | Asset tracking and reuse | `id`, storage path/url, alt text, type/meta, owner/ref, timestamps |
| Low | SEO/redirect support | Discoverability and control | populate/use entity SEO fields, redirect rules, sitemap inclusion flags/config as needed |

---

## 12. Prioritized Implementation Roadmap

| Priority | Phase | Scope | Outcome |
|---:|---|---|---|
| P0 | Alignment & discovery | Identify actual Admin Panel repo/APIs/services, confirm source-of-truth tables and revalidation triggers | Verified end-to-end CMS map |
| P1 | Data integrity & contracts | Fix slug/duplicate data issues, define canonical CMS schema/content contracts, secure revalidation integration | Reliable manageable foundation |
| P1 | Activate existing CMS data | Wire stored `homepage_sections` / `homepage_cms_published` (choose canonical source) into homepage with fallbacks | Immediate admin control using existing/stored config |
| P1 | Header/footer manageability | Make tagline, logo options, navigation menus, footer groups/links/contact/social/copyright configurable | Global chrome fully manageable |
| P2 | Full homepage & merchandising | Hero/campaign settings, featured/manual curation and ordering, section copy/visibility, brands/categories presentation, device assets | Complete homepage CMS control |
| P2 | Pages, SEO, cache completeness | Dynamic pages, metadata/OG/canonical/sitemap/robots, comprehensive tag/path invalidation | Content + SEO manageability and freshness |
| P3 | Feature gaps | Contact page/inbox, reviews, coupons/promotions surfacing if required | Close functional gaps |
| P3 | QA & hardening | Responsive/zoom/regression/accessibility, validation, fallbacks, monitoring, admin permission/propagation checks | Safe rollout preserving design/behavior |

---

## 13. Exact File Paths for Every Required Change

### 13.1 Existing files in this repository (customer site) to modify

- `src/app/layout.tsx`
- `src/app/globals.css` (if design/token adjustments needed for CMS-driven content; preserve current design)
- `src/app/page.tsx`
- `src/app/pages/[slug]/page.tsx`
- `src/app/category/[slug]/page.tsx`
- `src/app/product/[slug]/page.tsx`
- `src/app/collection/[slug]/page.tsx`
- `src/app/search/page.tsx`
- `src/app/shop/page.tsx`
- `src/app/api/revalidate/route.ts`
- `src/components/Header.tsx`
- `src/components/HeaderNav.tsx`
- `src/components/HeaderActions.tsx`
- `src/components/MobileMenu.tsx`
- `src/components/NavCompact.tsx`
- `src/components/Footer.tsx`
- `src/components/HeroSlider.tsx`
- `src/components/HomepageBottomCarousel.tsx`
- `src/components/EditorialShowcase.tsx`
- `src/components/CategoryImage.tsx`
- `src/components/ProductCard.tsx`
- `src/components/ProductGrid.tsx`
- `src/components/Listing.tsx`
- `src/components/SearchModal.tsx` (if placeholders/terms become manageable)
- `src/components/CompanySettingsLogo.tsx` (if logo config/alt/fallback rules expanded)
- `src/components/AnimatedLogo.tsx`, `src/components/AnimatedLogo.module.css` (only if branding becomes configurable)
- `src/lib/data.ts`
- `src/lib/hero-banners.ts`
- `src/lib/homepage-cms.ts`
- `src/lib/supabase.ts` (only if client/config typing/contracts require; no env/data changes in audit)
- `src/lib/format.ts` (if formatting becomes settings-driven)

### 13.2 Likely new files in this repository

- `src/lib/cms.ts` (typed CMS fetch/normalize/cache helpers)
- `src/lib/navigation.ts` or menu helper module (if menu model added)
- `src/app/contact/page.tsx` (if contact feature required)
- `src/components/ContactForm.tsx` and/or `src/actions/contact.ts` or route handler (if contact required)
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- Additional CMS-driven section/block components under `src/components/` as needed (preserving existing design)

### 13.3 External to this repository (required for full manageability)

- **Admin Panel application/repository (path unknown):** UI pages/components, CRUD forms, validation, permissions/roles, media upload, publish/draft/order/visibility controls, API/service mutations for all customer-site entities
- **Supabase project/migrations:** schema/RLS/storage/policy/data-integrity migrations listed in Section 11
- **Integration/config:** admin-side calls to `POST /api/revalidate` with correct secrets/tags/paths; environment/config alignment (no changes made in this audit)

---

## 14. Complete Management Matrix

| Website Section | Current Website Source | Database Table | Existing Admin Management | Status | Required Work |
|---|---|---|---|---|---|
| Header Logo (company image) | `src/components/Header.tsx`, `src/components/CompanySettingsLogo.tsx`, `src/components/Footer.tsx` | `business_settings.company_logo` | Not verifiable in this repo | **Partially implemented (DB-driven image, static placement/logic)** | Verify admin upload/update; add alt/fallback/device controls; unify header/footer usage; revalidate on change |
| Header Animated/HTML Logo | `src/components/AnimatedLogo.tsx`, `AnimatedLogo.module.css`, used in header/nav/footer | None (component/CSS) | Not verifiable | **Missing CMS (static)** | Decide keep static or make configurable (text/variant/asset) without redesign |
| Header Tagline/Promo Text | `src/components/Header.tsx` | None (hardcoded) | Not verifiable | **Missing** | CMS field for text/visibility/device/schedule |
| Navigation / Menus | `src/components/Header.tsx`, `HeaderNav.tsx`, `MobileMenu.tsx`, `HeaderActions.tsx` | `categories` (partial), no verified `menus/menu_items` | Not verifiable | **Partially implemented** | Menu builder for custom items/order/visibility/targets/device; manage mobile menu and labels; fix slug normalization dependency |
| Search Experience | `src/components/HeaderActions.tsx`, `SearchModal.tsx`, `src/actions/catalog.ts`, `src/lib/data.ts` | Derived from `products/categories/variants/...` + popular terms logic | Not verifiable | **Partially implemented (derived)** | Optional manageable placeholders/featured terms/merchandising toggles |
| Hero Section / Banners | `src/components/HeroSlider.tsx`, `src/lib/hero-banners.ts`, `src/app/page.tsx` | `website_content.hero_banner` (+ `hero_settings` stored unused) | Not verifiable | **Partially implemented** | Wire/use hero settings; full slide CRUD/order/active/device/CTA/media in admin with propagation |
| Homepage Campaign/Intro Strip | `src/app/page.tsx` | `business_settings`, `shipping_zones`, `website_content.hero_banner` (first slide) | Not verifiable | **Partially implemented (mixed/hardcoded)** | Dedicated manageable fields/section config and copy |
| Homepage Sections Composition | `src/app/page.tsx`, `src/lib/homepage-cms.ts` (unused) | `website_content.homepage_sections` (unused), `homepage_cms_published` (not verified as table/read not wired) | Not verifiable | **Missing/inactive integration** | Implement and wire canonical homepage CMS config (visibility/order/content) |
| Categories (Browse Grid + Links) | `src/app/page.tsx`, `CategoryImage.tsx`, `Header/Footer/Listing` | `categories` | Not verifiable | **Implemented (DB)** | Manage section copy/selection/order; ensure slug/image/SEO admin controls and revalidation |
| Featured Products Section | `src/app/page.tsx`, `src/components/EditorialShowcase.tsx` | `products.is_featured` (and unused homepage-cms selection concept) | Not verifiable | **Partially implemented** | Manual curation/order/limit and editable section copy/CTA |
| Product Listings / Filters | `src/app/shop/page.tsx`, `category/[slug]/page.tsx`, `search/page.tsx`, `Listing.tsx`, `ProductGrid.tsx`, `Facet/Filter/Sort/PriceFilter` | `products`, `product_variants`, `product_images`, `inventory`, `categories`, `collections` | Not verifiable | **Implemented (DB/derived)** | Merchandising/sort defaults/visibility controls and propagation checks |
| Product Cards | `src/components/ProductCard.tsx`, `CardAddButton.tsx`, `QuickAdd.tsx`, `SmartImage.tsx` | `products`, `product_images`, `product_variants`, `inventory` | Not verifiable | **Implemented (DB)** | Manage badges/labels/media/variant presentation rules as needed |
| Product Details (PDP) | `src/app/product/[slug]/page.tsx`, `ProductView.tsx`, `AddToCart.tsx`, `ShareButton.tsx` | `products`, `product_images`, `product_variants`, `inventory`, `brands`, `categories`, `website_content.policies` | Not verifiable | **Implemented** | SEO fields, content blocks, related/upsell curation, shipping/returns policy management |
| Collections | `src/app/collection/[slug]/page.tsx`, search | `collections`, `products.collection_id` | Not verifiable | **Partially implemented** | Visibility/order/homepage placement/SEO management |
| Brands Portfolio Section | `src/app/page.tsx` | `brands` | Not verifiable | **Implemented (DB)** | Manage section copy/order/links; brand CRUD and propagation |
| Bottom Carousel / Promo Banners | `src/components/HomepageBottomCarousel.tsx`, `HeroSlider.tsx`, `src/lib/hero-banners.ts` | `website_content.homepage_bottom_carousel` | Not verifiable | **Partially implemented** | Full CRUD/order/active/device/CTA and propagation verification |
| Contact Information (global) | `src/components/HeaderActions.tsx`, `src/components/Footer.tsx` | `business_settings` | Not verifiable | **Implemented (DB-driven values)** | Confirm all fields editable; display toggles/formatting |
| Contact Page / Form / Inbox | Not present | No verified `contact_messages` table | Not verifiable | **Missing** | Implement page/form/storage/admin inbox (migration + API/service) |
| Footer Content & Menus | `src/components/Footer.tsx` | `business_settings`, `website_content.social_links`, `payment_gateways_config`, `categories` | Not verifiable | **Partially implemented** | Footer menu builder, headings, copyright, link groups/order/visibility |
| Social Links | `src/components/Footer.tsx`, `src/lib/data.ts` | `website_content.social_links` | Not verifiable | **Implemented (DB)** | Admin CRUD/order/enable/platform mapping |
| Payment Method Labels/Display | `src/components/Footer.tsx`, `src/lib/data.ts` | `payment_gateways_config` | Not verifiable | **Partially implemented** | Manage display name/icon/order/visibility for storefront |
| Policy / Content Pages | `src/app/pages/[slug]/page.tsx` | `website_content.policies` | Not verifiable | **Partially implemented** | Dynamic pages/slugs/rich content/SEO/publish state; menu integration |
| SEO Metadata (site/page/entity) | `src/app/layout.tsx`, page `generateMetadata` in category/product/collection pages | `business_settings`, `products`/`categories`/`brands`/`collections` SEO fields (partially used) | Not verifiable | **Partially implemented** | Central/site SEO config, per-page/entity SEO management, OG/canonical/sitemap/robots |
| Cart / Checkout (customer flow) | `src/app/cart/page.tsx`, `src/app/checkout/page.tsx`, `CheckoutForm.tsx`, `CartDrawer.tsx`, `src/actions/order.ts` | `orders`, `order_items`, `payments`, `shipping_zones`, `payment_gateways_config`, store/local state | Not verifiable | **Implemented (functional), limited CMS** | Manage checkout content/messages/policy snippets/payment/shipping presentation if required |
| Order Tracking / Account Areas | `src/app/track-order/page.tsx`, `src/app/account/**`, `OrderView.tsx`, actions | `orders`, `order_items`, `order_status_history`, `customers`, `customer_addresses` | Not verifiable | **Implemented (functional)** | Content/status label manageability and notifications if needed |
| URL/Slug Integrity | Navigation/category routing/data consumers | `categories.slug` (and other slug fields) | Not verifiable | **Data issue present** | Validation/normalization in admin/import and defensive handling in frontend |

---

## Appendix A — Live Observations (sample, read-only)

- **`/` (home):** hero banners (2), campaign/intro, categories grid, featured products (6), brand description, 3 brand logos, bottom carousel, footer/contact/social/payment labels, cart drawer UI present.
- **`/shop`:** “All Products”, 95 products, type/size/price filters, sort, pagination observed.
- **Header/nav:** dual logos (company settings image + animated logo) and tagline rendered; category mega menu/mobile menu include hardcoded items (e.g. “New Arrivals”) and DB categories.
- **Data issue:** `Formal Dress` category slug stored as `/formal` yields malformed link `/category//formal` in live/rendered navigation.

## Appendix B — Evidence References (repository)

- **Routes/pages:** `src/app/**` (27 route/app files including layouts/loading/not-found/api/icon)
- **Components:** `src/components/**` (45 files)
- **Data/caching/CMS read:** `src/lib/data.ts`, `src/lib/hero-banners.ts`, `src/lib/homepage-cms.ts`, `src/lib/supabase.ts`, `src/lib/format.ts`, `src/lib/session.ts`, `src/lib/customers.ts`, `src/lib/store.ts`
- **Server actions:** `src/actions/account.ts`, `src/actions/auth.ts`, `src/actions/catalog.ts`, `src/actions/order.ts`
- **Revalidation:** `src/app/api/revalidate/route.ts`
- **Live checks:** https://pineapple-client.vercel.app/ and https://pineapple-client.vercel.app/shop fetched read-only during audit
- **DB checks:** read-only Supabase probe for table presence/counts and sampled `business_settings`, `website_content`, `categories`, `products`, `collections`, `brands`, `shipping_zones`, `payment_gateways_config`, `orders` etc. (from configured project; no mutations)

**End of audit. No application files (other than this report), database tables, data, UI, or configuration were modified.**
