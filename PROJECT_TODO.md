# Kay Stores — Project Checklist



> **Rule:** Mark an item `[x]` only when it is fully built and working.  

> Update this file after every page or system is completed. Do not skip updates.



**Last updated:** 2026-08-09

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

- [x] **Product comparison** (PDP + cart — search or Kay AI suggestions, up to 3 gifts)

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

- [x] **Recipient address required at gift checkout** (no “address unknown” / sender must provide delivery address)
- [x] **Recipient address collection page** (legacy Digital Handover — kept for older pending links only)

- [x] Order confirmation / thank-you page

- [x] **MOV + curation fees** — Gifting ₦50k / 30%, After Dark ₦20k / 40%, delivery + tax; cart, checkout, API validation



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



- [x] **About page** (`/about` — aligned with client proposal)

- [x] Concierge inquiry form (discrete link from footer / About)

- [x] Automated email to internal team on concierge submission

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



---



## Backend & logistics



- [x] SKU-based product catalog in Supabase

- [x] Order management (gift metadata, anonymous flag, recipient data)

- [x] Digital Handover workflow (generate + track recipient links)

- [x] Email notifications (concierge, order updates, recipient link)

- [x] **Flutterwave payments** — shop checkout + concierge pay-after-selection; webhook at `/api/webhooks/flutterwave`

- [x] **Vendor invite vs self-apply** — Kay invites choose instant access or profile-first (both auto-approved); self-apply collects NIN and stays pending admin review

- [x] **Pending invites tab** — Members → Invited lists open role invites with reminder email + copy link

- [x] **Admin markup tiers** — `/admin/pricing` sets % and/or flat ₦ by vendor list-price range (shop + concierge); migration `024_pricing_markup_tiers.sql`

- [ ] Inventory sync



---



## Progress summary



| Area              | Done | Total |

|-------------------|------|-------|

| Foundation        | 7    | 7     |

| Design system     | 6    | 7     |

| Shop pages        | 15   | 15    |

| Cart & checkout   | 11   | 11    |

| AI engine         | 4    | 6     |

| About & concierge | 9    | 9     |

| Help & legal      | 10   | 11    |

| Backend           | 7    | 8     |



**Overall:** 69 / 74 checklist items complete



---



## Proposal alignment (client vision)



| Proposal pillar | MVP status | Notes |

|-----------------|------------|-------|

| Intelligent gifting (Kay AI) | Partial | Mock AI live; real LLM + multi-gift bundles TBD |

| Comparison feature | Done | Full page + PDP + cart |

| Special requests (Concierge) | Done | Full flow: dispatch → vendor offers with photos → client picks → fulfilment |

| Privacy / John Doe (After Dark) | Partial | 18+ gate, `/after-dark`; encrypted aliases TBD |

| MOV + curation fees | Done | Enforced at cart & checkout; server-validated |

| 72hr delivery / 3-point vetting | Content | Policy pages live; ops not automated |

| Retainers / birthday reminders | Not started | Future phase |


