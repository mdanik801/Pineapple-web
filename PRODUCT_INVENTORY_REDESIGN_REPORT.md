# PRODUCT_INVENTORY_REDESIGN_REPORT

## Status: PARTIALLY IMPLEMENTED (safe code changes + migration plan prepared). DB migrations/backfills and live E2E verification **NOT executed** (no explicit approval / no live DB-admin session).

## Actual Project Paths
- **Customer Website (workspace):** `C:\Users\Anik\Desktop\Client\Pineapple-web`
- **Admin Panel:** `C:\Users\Anik\Desktop\admin\Adminpanel-ecom` (verified accessible)

## Existing Architecture (inspected)
- **Product catalog:** `admin/app/dashboard/products/page.jsx`, `admin/services/products.service.js`, `admin/components/products/VariantManager.jsx`, `admin/components/ui/MultiImageGalleryUploader.jsx`; tables `products`, `product_variants`, `product_images`.
- **Inventory:** `admin/app/dashboard/inventory/page.jsx`, `admin/services/inventory.service.js`; tables `inventory`, `inventory_transactions`.
- **Purchases (supplier/PO):** `admin/app/dashboard/purchases/page.jsx`, `admin/services/purchases.service.js`, `admin/services/suppliers.service.js`; tables `purchases`, `purchase_items`, `goods_receipts`, `goods_receipt_items`, `supplier_payments`; RPC `process_goods_receipt`.
- **Orders/sales integration:** `admin/services/orders.service.js` (reservations, deductions, cancellation release, revenue/COGS recognition, invoice flow) — preserved.
- **Customer reads:** `client/src/lib/data.ts` (prices from `products/product_variants`, available stock from `inventory.current_stock-reserved_stock`, variants/images/SEO), product/search/category/cart/checkout flows — preserved.

## All Product Fields Preserved
Form/service continue to support: `name, sku, barcode, slug, product_type, regular_price, sale_price, cost_price (snapshot), category_id, brand_id, collection_id, short_description, description, video_url, display_order, featured_image, images[] (gallery), variants[] (size/color/attributes/summary/pricing/cost/stock/threshold/status/image), is_featured, status`, and SEO fields `seo_title, seo_description, focus_keyword, image_alt_text, canonical_url, noindex, seo_notes`; existing DB/compat fields (e.g. `is_trending/is_new_arrival/is_upcoming/related_product_ids/og_*` per migrations) preserved. Product create/edit remains catalog-focused with all original field groups intact.

## All SEO Fields Preserved
`seo_title`, `seo_description`, `focus_keyword`, `image_alt_text`, `canonical_url`, `noindex`, `seo_notes` retained in UI, load, sanitize, save and service flows. Product slugs/IDs/relationships unchanged.

## Inventory Changes (completed in code)
- **New:** `admin/services/inventory-receipts.service.js` — search existing products (name/SKU/barcode/slug), select existing product/variant only, additive receipt save (`new = prev + qty`), WAC recalc, separate historical `inventory_transactions` receipt entries (`reference_type='inventory_receipt'`, unit cost snapshot, qty/prev/new, ref/date/notes metadata, created_by/created_at), optional explicit current selling-price sync to product/variant, parent variant-stock sync, audit + revalidation.
- **Inventory UI redesigned:** `admin/app/dashboard/inventory/page.jsx` — visible **Add to Inventory** action/modal (product search, variant selector, unit purchase cost, regular selling price, quantity, auto total purchase cost, purchase date, reference, notes, update-current-price option), tabs for Current Stock / Purchase History / Stock Movements, per-item History modal, available stock (current-reserved), WAC/valuation, adjustment with mandatory reason.
- **Product/Inventory separation:** product edit UI disables stock/cost intake fields and directs repeated purchases to Inventory; service guards prevent accidental inventory/history overwrite on catalog edits while keeping compatibility for explicit legacy cases.

## Repeated Purchase Implementation
- Same existing product/variant can be selected repeatedly; each save creates an independent receipt history entry (no duplicate product records).
- Historical unit costs/quantities preserved per entry; WAC/current-cost snapshots updated separately; stock accumulates cumulatively.

## Database Changes
- **Executed:** none.
- **Prepared (not applied):** proposed `inventory_purchase_receipts` table + indexes (+ optional RPC/constraints) in `DATABASE_MIGRATION_AND_BACKFILL_PLAN.md` for first-class fields (selling price snapshot, status, correction/reversal refs, updated_by/updated_at, normalized refs/notes) and stronger atomicity/idempotency.

## Historical Purchase Cost Handling
- Per-receipt `unit_cost` stored in `inventory_transactions` and never rewritten; receipt metadata preserves cost/sell/qty/total/ref/date/notes snapshot. Prior entries remain intact.

## Variant-Level Stock Behavior
- Variant-required for variable products; inventory updates target selected variant row and sync parent aggregate; no cross-variant leakage. Existing variant attributes/IDs/pricing relations preserved.

## Selling Price Synchronization
- Receipt can explicitly update current selling price source (`products.regular_price` or `product_variants.regular_price`) which customer site reads; sale price/history/order prices unaffected. Customer `src/lib/data.ts` compatibility preserved (lint/build PASS).

## Audit Trail / Permissions
- Receipt records `created_by` (valid UUID) and timestamp; reason/reference metadata captured; `logActivity` emitted; adjustments remain reason-mandatory. Full updated_by/status/correction workflow requires approved schema additions.

## Customer Website Integration
- No breaking changes to `src/lib/data.ts` pricing/stock logic (`regular/sale`, `inventory.current_stock-reserved_stock`), product detail/variants/SEO/slug flows. **Customer `npm run lint` PASS, `npm run build` PASS.** Live propagation/E2E not verified.

## Purchases Module Fixes
- Fixed service/UI mismatches: `createPO` alias, receive args/RPC payload mapping (`purchase_item_id/quantity/unit_cost`), `purchase_number/grand_total/partially_paid` fields, payment arg names and supplier linkage; supplier balance calc aligned to normalized received items.

## Test Results / Build-Lint
- Admin service syntax checks: **PASS** (`products, inventory, purchases, inventory-receipts`).
- Admin JSX `node --check`: **not applicable** (`.jsx` extension). Admin lint/build/tests: **not run** (dirty workspace / not executed).
- Customer lint/build: **PASS**.
- Required manual/DB/browser E2E scenarios (1–22): **NOT FULLY VERIFIED** — see `END_TO_END_VERIFICATION_REPORT.md`.

## Remaining Issues
- Dedicated receipt table/RPC/constraints not applied (approval required) for complete requested audit fields and concurrency/idempotency guarantees.
- Live Admin→DB→Customer verification, repeated-purchase DB proof, cart/checkout runtime, variant runtime, and sales regression tests pending.
- `created_by` resolution to display name/profile in UI and full correction/reversal UX not completed.
- Purchases/Inventory UX can be further unified (PO-GRN vs direct receipt) once schema/workflow policy approved.

## Pending Approvals
- Approve and execute migration/backfill plan: `DATABASE_MIGRATION_AND_BACKFILL_PLAN.md` (and any RPC/RLS additions) before production schema/data changes.
- Confirm selling-price update policy for receipts (default on/off per business rule) and any weighted-average vs replacement pricing policy beyond current implementation.

## Related Reports
- `PRODUCT_DATA_PRESERVATION_REPORT.md`
- `PURCHASE_HISTORY_AND_STOCK_LOGIC_REPORT.md`
- `DATABASE_MIGRATION_AND_BACKFILL_PLAN.md`
- `END_TO_END_VERIFICATION_REPORT.md`
