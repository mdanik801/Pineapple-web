# PURCHASE_HISTORY_AND_STOCK_LOGIC_REPORT

## Scope
Implements/aligns repeated "Add to Inventory" receipts for existing products, fixes Purchases UI/service mismatches, and documents stock/cost/price logic. **No DB migrations executed.**

## Repeated Purchase / Receipt Implementation (Admin)
- **New service:** `admin/services/inventory-receipts.service.js`
  - `searchProducts(query)`: searches existing non-deleted products by name/SKU/barcode/slug and returns active variants (no product creation).
  - `addReceipt(payload, adminUser)`: validates existing product/variant, positive qty, non-negative unit cost/selling price; computes `total = unit_purchase_cost * qty`; loads existing inventory row (product or variant, legacy-null fallback); **adds stock cumulatively** (`new = previous + qty`, never replaces); recalculates WAC from previous stock/value + receipt value; creates/updates inventory row; inserts **separate historical** `inventory_transactions` row per save with `transaction_type='purchase_received'`, `reference_type='inventory_receipt'`, `reference_id` (purchase ref or generated), `quantity_change`, `previous_stock/new_stock`, `unit_cost` (receipt unit cost snapshot), encoded reason metadata (ref/unit/sell/qty/total/date/notes), `created_by`, `created_at` (purchase date ISO); updates variant/product `cost_price` (WAC snapshot) and optionally `regular_price` (current selling price) when enabled; syncs variable parent inventory total; logs activity and triggers customer revalidation.
  - `getPurchaseHistory(...)`: returns `inventory_receipt` transactions mapped with `purchase_reference`, `quantity_purchased`, `unit_purchase_cost`, `total_purchase_cost` while preserving stored row/history.
- **Inventory UI:** `admin/app/dashboard/inventory/page.jsx`
  - Added **Add to Inventory** button/modal: search & select existing product, variant selector for variable products, unit purchase cost, regular selling price, quantity, auto total purchase cost, purchase date, reference, notes, explicit "Update current selling price" option (default on) with notice that historical costs remain preserved.
  - Tabs: Current Stock (physical/reserved/available/WAC/valuation/status/actions), **Purchase History** (receipt entries), **Stock Movements** (all transactions). Per-row **History** modal shows purchase receipts + movements for selected product/variant line.
  - Stock adjustment flow preserved (reason required, audited).

## Historical Cost / Price Handling
- **Per-entry historical unit cost:** stored in `inventory_transactions.unit_cost` for each receipt; not overwritten by later receipts.
- **Historical quantity/resulting stock:** `quantity_change`, `previous_stock`, `new_stock` preserved per entry.
- **Selling price snapshot:** captured in receipt metadata (reason) and applied to current selling-price source (`products.regular_price` or `product_variants.regular_price`) only when explicitly enabled; historical entry metadata remains intact. **Note:** existing schema lacks a dedicated normalized per-receipt `selling_price_snapshot` column—migration proposed (see migration plan) for first-class storage/audit fields.
- **WAC:** recalculated and stored in `inventory.weighted_average_cost` and cost snapshots for valuation/current-cost display; does not rewrite prior receipt `unit_cost` history.
- **Customer orders:** no changes to order item histo
