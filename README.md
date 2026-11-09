# Pineapple — Customer Storefront

Next.js 16 + Tailwind 4 + Supabase (shared with the admin panel).

Theme: Dark Green `#0A3C2A` · White `#FFFFFF` · Gold `#C49A3E`

## Run
```bash
npm install
npm run dev      # http://localhost:3000
```
`.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`.
All DB access happens server-side only (`src/lib/supabase.ts` is `server-only`).

## Features
Categories/sub-categories, product listing (search/sort/price/pagination), product page (variants, stock),
cart drawer + cart page, wishlist, guest + account checkout (COD), customer register/login (scrypt + JWT cookie),
profile, address book, order history + timeline.

## Tables used
categories, products, product_images, product_variants, inventory, brands, homepage_banners, business_settings,
website_content, shipping_zones, customers, customer_addresses, orders, order_items, order_status_history, payments.
