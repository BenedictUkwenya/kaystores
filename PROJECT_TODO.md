# Kay Stores — Project Checklist

> **Rule:** Mark an item `[x]` only when it is fully built and working.  
> Update this file after every page or system is completed. Do not skip updates.

**Last updated:** 2026-06-26

---

## Foundation & setup

- [x] Next.js + TypeScript + Tailwind scaffold
- [x] Supabase client setup (browser, server, middleware)
- [x] Environment variables template (`.env.local.example`)
- [x] Vercel-ready Next.js config
- [x] Supabase database schema (products, orders, inventory SKUs)
- [x] Supabase migrations committed
- [ ] Production deploy on Vercel

> **Note:** Run `supabase/migrations/001_products.sql`, `002_orders.sql`, and `supabase/seed.sql` in your Supabase SQL Editor. Until products migration runs, fallback product data is used. Orders use in-memory storage in dev until `002_orders.sql` is applied and wired to Supabase.

---

## Design system

- [x] Light theme (cream palette, typography)
- [x] Kay After Dark theme (CSS variables + toggle)
- [x] Logo / wordmark in header & footer
- [x] After Dark polish on all pages (shop uses CSS variables)
- [x] Shared UI components (buttons, inputs, cards, modals)
- [ ] Responsive breakpoints verified site-wide

---

## Pages — Shop & browse

- [x] **Home / landing page**
- [x] **Gifts** (main catalog)
- [x] **By Occasion**
- [x] **By Recipient**
- [x] **Luxury Collection**
- [x] **Corporate Gifting**
- [x] Category: For Her
- [x] Category: For Him
- [x] Category: For Parents
- [x] Category: For Friends
- [x] Category: For Kids
- [x] Category: Corporate Gifts
- [x] **Product detail page (PDP)**
- [x] **Search results page**

---

## Cart & checkout (core differentiator)

- [x] Slide-out **cart drawer**
- [x] Cart state (add / remove / update qty)
- [x] **Checkout page** — “Delivering to Myself” vs “Sending as a Gift” fork
- [x] Gift flow: recipient fields
- [x] Gift flow: “I don’t know their address” toggle
- [x] Gift flow: recipient WhatsApp / email capture
- [x] Gift flow: recipient note (with character limit)
- [x] Gift flow: **Anonymous** toggle (strip buyer data from labels/slips)
- [x] **Recipient address collection page** (secure branded link — Digital Handover)
- [x] Order confirmation / thank-you page

---

## AI suggestion engine

- [x] Kay AI UI on homepage (input + suggestion pills)
- [x] Mock suggestion API route (`/api/ai/suggest` — rules-based, no API keys)
- [ ] LLM wrapper + vector search API route (replace mock when keys ready)
- [ ] Product embeddings in Supabase
- [x] Return 3–5 curated products per prompt
- [x] “Add to Cart” on each suggestion → gifting checkout flow
- [x] After Dark mode: prioritize `exclusive` / `night_collection` tags

---

## About & concierge

- [ ] **About page**
- [x] Concierge inquiry form (discrete link from footer / About)
- [ ] Automated email to internal team on concierge submission

---

## Help, legal & footer pages

- [ ] FAQs
- [ ] Delivery & Returns
- [ ] Track Order
- [ ] Contact Us
- [ ] Our Story
- [ ] Careers
- [ ] Press
- [ ] Sustainability
- [ ] Privacy Policy
- [ ] Terms & Conditions
- [ ] Newsletter signup backend (UI exists in footer)

---

## Optional / later

- [x] Account / profile area (nav icon — sign in, sign out, basic profile)
- [ ] Wishlist (heart icons on product cards)
- [ ] Corporate gifting inquiry flow (beyond catalog page)

---

## Backend & logistics

- [x] SKU-based product catalog in Supabase
- [ ] Order management (gift metadata, anonymous flag, recipient data)
- [ ] Digital Handover workflow (generate + track recipient links)
- [ ] Email notifications (concierge, order updates, recipient link)
- [ ] Payment integration
- [ ] Inventory sync

---

## Progress summary

| Area              | Done | Total |
|-------------------|------|-------|
| Foundation        | 6    | 7     |
| Design system     | 5    | 6     |
| Shop pages        | 14   | 14    |
| Cart & checkout   | 10   | 10    |
| AI engine         | 4    | 6     |
| About & concierge | 1    | 3     |
| Help & legal      | 0    | 11    |
| Backend           | 1    | 6     |

**Overall:** 42 / 63 checklist items complete
