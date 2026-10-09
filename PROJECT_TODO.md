# Kay Stores — Project Checklist



> **Rule:** Mark an item `[x]` only when it is fully built and working.  

> Update this file after every page or system is completed. Do not skip updates.



**Last updated:** 2026-10-09

---



## Foundation & setup



- [x] Next.js + TypeScript + Tailwind scaffold

- [x] Supabase client setup (browser, server, middleware)

- [x] Environment variables template (`.env.local.example`)

- [x] Vercel-ready Next.js config

- [x] Supabase database schema (products, orders, inventory SKUs)

- [x] Supabase migrations committed

- [x] Production deploy on Vercel



> **Note:** Run migrations `001`–`004` and `seed.sql`. Vendor onboarding needs `023_vendor_onboarding.sql`. Email via Resend → see `supabase/SECRETS.md`.



---



## Design system



- [x] Light theme (cream palette, typography)

- [x] Kay After Dark theme (CSS variables + toggle)

- [x] **Kay After Dark 18+ experience** (`/after-dark` — age gate, hero, catalog, curated box)

- [x] Logo / wordmark in header & footer

- [x] Brand splash screen + Kay mark loading states

- [x] Favicon, app icons, email logo from brand mark

- [x] After Dark polish on all pages (shop uses CSS variables)

- [x] Shared UI components (buttons, inputs, cards, modals)

- [ ] Responsive breakpoints verified site-wide

- [x] **Oct 11 launch countdown** — slim bar on every page, floating pill, full-screen flip-clock modal with “Remind me”, home hero section



---



## Pages — Shop & browse



- [x] **Home / landing page**

- [x] **Gifts** (main catalog)

- [x] **By Occasion**

- [x] **By Recipient**

- [x] **Luxury Collection**

- [x] **Corporate Gifting**

- [x] **Kay Kitchen** (`/table` — edible gifts, custom cake requests, vendor/admin inbox)

- [x] Category: For Her

- [x] Category: For Him

- [x] Category: For Parents

- [x] Category: For Friends

- [x] Category: For Kids

- [x] Category: Corporate Gifts

- [x] **Product detail page (PDP)**

- [x] **Product comparison** (PDP + cart — search or Kay AI suggestions, up to 3 gifts)

- [x] **Search results page**

- [x] **Multi-select allergens** — vendors tick every allergen that applies (chips); PDP shows them as pills



---



## Cart & checkout (core differentiator)



- [x] Slide-out **cart drawer**

- [x] **Random product discovery** — home + gifts + After Dark mix the catalogue per visit (default sort Discover), so every product gets a fair shot


- [x] **Checkout page** — “Delivering to Myself” vs “Sending as a Gift” fork

- [x] Gift flow: recipient fields

- [x] Gift flow: “I don’t know their address” toggle

- [x] Gift flow: recipient WhatsApp / email capture

- [x] Gift flow: recipient note (with character limit)

- [x] Gift flow: **Anonymous sender** toggle (strip buyer name from labels/slips)
- [x] **Anonymous packaging for everyone** — plain outer wrap option on all checkouts (self + gift, not After Dark only)

- [x] Kay Reveal QR (video/photo/note, custom QR sticker, `/reveal/[token]`)

- [x] **Recipient address required at gift checkout** (no “address unknown” / sender must provide delivery address)
- [x] **Recipient address collection page** (legacy Digital Handover — kept for older pending links only)

- [x] Order confirmation / thank-you page

- [x] **MOV + pricing** — Gifting ₦20k / After Dark ₦20k MOV; delivery from live quote + tax; curation fee retired (list price is product price)

- [x] **Split the cost** — checkout toggle (2–10 people), share links with copy/WhatsApp, public `/split/[token]` Paystack page, order confirms when all shares paid, 72h expiry cron cancels + restores stock + flags refunds



## AI suggestion engine



- [x] Kay AI UI on homepage (input + suggestion pills)

- [x] Mock suggestion API route (`/api/ai/suggest` — rules-based, no API keys)

- [x] LLM wrapper on `/api/ai/suggest` — floating Kay chat (gift talk, order status, gift note, compare, Kitchen or concierge handoff). Gemini model chain. Featured slots in admin (`046_ai_featured_slots.sql`). Product embeddings still separate.

- [ ] Product embeddings in Supabase

- [x] Return 3–5 curated products per prompt

- [x] “Add to Cart” on each suggestion → gifting checkout flow

- [x] After Dark mode: prioritize `exclusive` / `night_collection` tags



---



## About & concierge



- [x] **About page** (`/about` — aligned with client proposal)

- [x] Concierge inquiry form (discrete link from footer / About)

- [x] Automated email to **every admin** (+ team inbox) on concierge submission

- [x] **Kay Kitchen emails** — admins on new cake/edible request; client + assigned baker after quote/assign

- [x] **Admin → vendor concierge dispatch** (send to all or selected vendors; vendor portal to respond with availability & quote)

- [x] **Client request status tracking** (`/concierge/status` — reference + email lookup, timeline view)

- [x] **Concierge admin-curated offers** — vendors quote internally; admin presents one recommendation; client accepts, requests revision, or cancels

- [x] **Post-selection fulfilment** — winning vendor sourcing → Kay hub; losers notified; admin release client contact when ready

- [x] **Admin concierge queues** — filter tabs (dispatch, quotes, present, awaiting client, fulfilment, closed), pagination, stale highlighting



---



## Help, legal & footer pages



- [x] FAQs

- [x] Delivery & Returns

- [x] Track Order

- [x] Contact Us

- [x] In-app support chat (`/support` + `/admin/support`, email alerts, images)

- [x] Our Story (→ `/about`)

- [x] Careers

- [x] Press

- [x] Sustainability

- [x] Privacy Policy

- [x] Terms & Conditions

- [ ] Newsletter signup backend (UI exists in footer)



---



## Optional / later



- [x] Account / profile area (nav icon — sign in, sign out, basic profile)

- [ ] Wishlist (heart icons on product cards)

- [ ] Corporate gifting inquiry flow (beyond catalog page)

- [x] **"Thank you, Messi" tribute (6–8 Oct, self-expiring)** — one-time intro, tribute hero + quote marquee, rolling golden football on shop pages, auto "Messi's Picks" shelf; stylised only (no likeness); window via `NEXT_PUBLIC_MESSI_TRIBUTE_START/END`



---



## Backend & logistics



- [x] SKU-based product catalog in Supabase

- [x] Order management (gift metadata, anonymous flag, recipient data)
- [x] **Admin order ship-to + order support chat** — delivery address on admin order, per-order chat for admin / vendor / signed-in customer (migration `035`)

- [x] Digital Handover workflow (generate + track recipient links)

- [x] Email notifications (concierge, Kay Kitchen, order updates, recipient link)

- [x] **Manual payment confirm at checkout** (“Yes, I have paid” — fallback when online gateway is offline)

- [x] **Paystack live payments** — initialize, verify, webhook URL, and Vercel keys configured

- [x] **Vendor invite vs self-apply** — Kay invites choose instant access or profile-first (both auto-approved); self-apply collects NIN and stays pending admin review

- [x] **Pending invites tab** — Members → Invited lists open role invites with reminder email + copy link

- [x] **Admin markup tiers** — `/admin/pricing` sets % and/or flat ₦ by vendor list-price range (shop + concierge); migration `024_pricing_markup_tiers.sql`

- [x] **Admin vendor product import** — CSV + SKU-named images at `/admin/products/import`, plus one-off form at `/admin/products/new`

- [x] **Kay-owned product catalogue** — admin listings with no vendor payout, including product images, editing, and deletion

- [x] **Premium admin & vendor portal redesign** — icon-led operations shell, richer overview/products/orders/onboarding, denser usable workspace

- [x] **Checkout map address picker** — OpenStreetMap pin / search / current location / paste Maps link (no Google API key)

- [ ] **Terminal Africa multi-hub shipping** — Admin Shipping (Terminal + manual Kay delivery toggles), hubs, state routing, seed hubs implemented; run migrations `030`–`033`, keep `TERMINAL_AFRICA_SECRET_KEY` on Vercel when using Terminal, then mark complete

- [x] **Vendor hub dispatch** — vendors pick ~2 nearest hubs, attach hub phone on parcel, mark dispatched; order email includes hub options; 12h reminder cron (`038`, `/api/cron/vendor-hub-reminders`, redeploy `send-email` edge function)

- [x] **Kay relays all chat (two channels)** — customer and vendor never talk directly; admin sees Customer / Vendor tabs with “Relay to…”; vendors no longer see customer contact details

- [x] **Chat email alerts + unread badges** — throttled emails (10 min) for Kitchen + order chats; admin/vendor sidebar badges when a reply is needed

- [x] **Kay Kitchen status auto-save + customer email** — status saves instantly from the dropdown and emails the customer

- [x] **Vendor dispatch follow-ups** — 12h vendor reminder + admin alert, 24h second reminder + admin alert, overdue badge on admin Orders

- [x] **System review — order privacy & fulfilment** — guest order/kitchen access keys, checkout validation, admin paid→hub QC→ship/deliver/cancel, abandoned unpaid cleanup, per-vendor order chat, withdrawal guard (migration `041`)

- [x] **Kay Kitchen quote payment** — client accept & pay (Paystack `table`), richer request brief, baker hub instructions, admin mark paid (migration `043`)

- [x] **Concierge pay + delivery** — delivery address at payment, price lock after offer is shown, hub instructions for vendors, admin alert when item reaches hub

- [x] **All email sent from Vercel + admin order alerts** — every email type renders in `src/lib/email/render.ts` and goes straight to Resend (edge `send-email` is fallback only); every admin + `KAY_TEAM_EMAIL` gets paid-order and bank-transfer-order alerts (set `KAY_TEAM_EMAIL` on Vercel)

- [ ] **Kay Kitchen vendor quotes** — assigned baker sends a price, admins emailed, admin card shows vendor price + suggested client price (markup tiers) and “Send quote to client”, client accept & pay or decline (admins + client emailed); run migration `044_kitchen_vendor_quotes.sql`, test the flow live, then mark complete

- [ ] **Admin & vendor portal overhaul ("Jobs")** — admin Today inbox (whose turn, one-click next steps), Gift / Kitchen / Concierge boards, guided job page (stage tracker, client ⇄ Kay ⇄ vendor money panel, relay chat, timeline); vendor "Your jobs" home + job page with "I've sent it"; kitchen & concierge now go through the hub (sent → at hub → QC → out for delivery → delivered) with emails; run migration `045_job_fulfilment_steps.sql`, click through each flow live, then mark complete

- [ ] **Catalog attributes & discovery** — structured tags, vendor original price, and improved search are implemented; run migration `028_catalog_attributes.sql`, backfill tags/prices on existing products, then mark complete

- [ ] **Flexible product variations** — vendor/admin-defined variation axis with per-option stock and PDP chips are implemented; run migration `029_product_variations.sql`, then mark complete

- [ ] Inventory sync



---



## Progress summary



| Area              | Done | Total |

|-------------------|------|-------|

| Foundation        | 7    | 7     |

| Design system     | 7    | 8     |

| Shop pages        | 17   | 17    |

| Cart & checkout   | 13   | 13    |

| AI engine         | 5    | 6     |

| About & concierge | 9    | 9     |

| Help & legal      | 11   | 12    |

| Backend           | 18   | 20    |



**Overall:** 88 / 93 checklist items complete



---



## Proposal alignment (client vision)



| Proposal pillar | MVP status | Notes |

|-----------------|------------|-------|

| Intelligent gifting (Kay AI) | Partial | Mock AI live; real LLM + multi-gift bundles TBD |

| Comparison feature | Done | Full page + PDP + cart |

| Special requests (Concierge) | Done | Full flow: dispatch → vendor offers with photos → client picks → fulfilment |

| Privacy / John Doe (After Dark) | Done | Server age cookie, catalogue wall-off, dedicated AD PDP/search, checkout 18+ gate; encrypted aliases TBD |

| MOV + pricing | Done | MOV enforced; curation fee off; delivery quote + tax |

| 72hr delivery / 3-point vetting | Content | Policy pages live; ops not automated |

| Retainers / birthday reminders | Not started | Future phase |


