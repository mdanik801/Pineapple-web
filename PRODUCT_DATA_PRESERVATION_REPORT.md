# PRODUCT_DATA_PRESERVATION_REPORT

## Actual Project Paths
- **Customer Website:** `C:\Users\Anik\Desktop\Client\Pineapple-web`
- **Admin Panel:** `C:\Users\Anik\Desktop\admin\Adminpanel-ecom`

## Objective
Preserve the complete existing Product Management system (all catalog, SEO, image, variant, relationship, publishing fields) while separating purchase/stock intake responsibility into Inventory "Add to Inventory". No destructive DB operations performed.

## Product Fields Preserved (code-level)
**Admin Product form/state (`app/dashboard/products/page.jsx`) retained:**
- Identity/catalog: `name, sku, barcode, slug, product_type`
- Pricing: `regular_price, sale_price` (catalog/current display), `cost_price` snapshot field retained
- Taxonomy/relationships: `category_id, brand_id, collection_id`
- Content: `short_description, description, video_url, display_order`
- Media: `featured_image, images[]` (gallery via `MultiImageGalleryUploader`)
- Variants: `variants[]` via `VariantManager` (size/color/attributes/summary/SKU/prices/cost/stock/threshold/status/image as per existing component/service)
- Merchandising/publishing: `is_featured` (Homepage Featured Pieces), `status`
- SEO: `seo_title, seo_description, focus_keyword, image_alt_text, canonical_url, noindex, seo_notes`
- Legacy/compat fields preserved where present in payload/service/DB: `is_trending, is_new_arrival, is_upcoming, related_product_ids, og_*` etc. (sanitizer/service still maps existing known fields)

**Service/schema preservation (`services/products.service.js`, migrations 001/003/007):**
- Product IDs/slugs/SKUs/barcodes, product type, variant records (`product_variants`), product images (`product_images` with url/storage_path/alt/display_order/is_primary/file_size), category/brand/collection relations, status lifecycle (draft/published/archived/trash soft-delete), featured image, SEO columns and extended catalog columns preserved.
- Create/update continues to sync images and variants; delete/restore/archive logic unchanged.

## Responsibility/Behavior Changes (non-destructive, compatibility-safe)
- **Product Edit UI:** stock/cost inputs disabled/read-only for existing records with guidance to use Inventory → Add to Inventory; edit submit omits `initial_stock`/`cost_price` intent fields to avoid accidental overwrite.
- **Product Create UI:** still allows initial catalog setup values (including initial stock/cost) for compatibility; repeated purchases/stock additions directed to Inventory.
- **`products.service.js` update:** preserves existing inventory/pricing/cost by default; simple-product inventory/cost sync only when explicitly provided and changed (legacy compatibility) and logs an adjustment transaction if stock differs. Variable parent inventory summary remains synced to variant totals without resetting reserved/valuation fields unnecessarily. No deletion of historical transactions, orders, or inventory records.
- **`products.service.js` create:** behavior preserved (initial images/variants/inventory/transactions/audit/revalidation).

## Existing Data Compatibility / Mapping
- **No DB migration/backfill executed (requires approval).** Existing product, variant, image, SEO, inventory, reserved, WAC/cost, order, and transaction data remain untouched.
- Existing `products.regular_price/sale_price/cost_price`, `product_variants.*`, `inventory.current_stock/reserved_stock/weighted_average_cost` continue to be valid sources for Admin and Customer reads.
- New receipt workflow updates `inventory.current_stock` additively, recalculates WAC, records `inventory_transactions` entries (`reference_type='inventory_receipt'`, `transaction_type='purchase_received'`), and (by default/explicit option) updates current selling price on product/variant `regular_price` so Customer Website sees correct current price. Historical receipt costs are preserved per transaction row (and metadata in reason/reference), never overwritten.

## Gaps / Notes
- Full fidelity of every custom/DB-only product field depends on existing schema columns; sanitizer allows known fields and does not drop unrelated preserved DB columns on read, but only fields present in form payload are resaved—existing fields not surfaced in form remain unchanged in DB on normal update paths.
- Legacy `initial_stock` meaning on edit is now "current stock snapshot/read-only" to prevent misuse; historical intake remains in inventory/transactions.
- Live verification of "edit existing product without losing any field" against production data not performed (no DB/session access).
