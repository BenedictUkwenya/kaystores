export const ABOUT_PILLARS = [
  {
    title: "Intelligent gifting",
    description:
      "Kay AI helps you find the right gift for any occasion — from a single curated pick to a multi-item gifting package, without the guesswork.",
  },
  {
    title: "Informed comparison",
    description:
      "Compare similar gifts side by side — price, specs, and fit — so you decide with confidence. We show the differences; the choice stays yours.",
  },
  {
    title: "Special requests",
    description:
      "Can't find it in our catalog? Our concierge team sources exclusive pieces, limited editions, and hard-to-find items on your behalf.",
  },
  {
    title: "Absolute discretion",
    description:
      "Anonymous delivery, minimalist packaging, and Kay After Dark — designed for clients who value privacy as the ultimate luxury.",
  },
] as const;

export const ABOUT_LUXURY_STANDARDS = [
  {
    title: "Engineering",
    description:
      "Bespoke rigid packaging with magnetic closures — every unboxing feels intentional and substantial.",
  },
  {
    title: "Tactile curation",
    description:
      "Products presented in velvet-lined displays, transforming delivery into a slow-reveal ritual.",
  },
  {
    title: "Absolute discretion",
    description:
      "Anonymous outer packaging and confidential handling — especially within our After Dark collection.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "What is Kay Stores?",
    answer:
      "Kay is a luxury gifting platform built for convenience, curation, and discretion. Order thoughtful gifts for loved ones, clients, or colleagues — with Kay AI to help you choose, comparison tools to decide confidently, and concierge sourcing when you need something we don't list yet.",
  },
  {
    question: "How does Kay AI gifting work?",
    answer:
      "Describe who the gift is for and the occasion — for example, \"a gift for my brother who just graduated.\" Kay AI suggests curated options you can add to your bag, including multi-item combinations. It's designed to save you time when you're unsure what to buy.",
  },
  {
    question: "How does product comparison work?",
    answer:
      "On any product page, tap Compare to see similar in-stock gifts. Add alternatives via search or Kay AI suggestions, then view a side-by-side breakdown of price, availability, specs, and gifting fit. We highlight key differences — the final choice is always yours.",
  },
  {
    question: "What is Concierge Sourcing?",
    answer:
      "Our special-request service for items not in the catalog. Submit what you're looking for — including reference images — and a Kay agent will source it from our verified vendor network and get back to you.",
  },
  {
    question: "What is Kay After Dark?",
    answer:
      "Our discreet shopping experience for intimacy and wellness products. After Dark prioritizes privacy: neutral packaging, anonymous delivery options at checkout, and a separate curated catalog. Your order details are handled with confidentiality.",
  },
  {
    question: "Can I send a gift anonymously?",
    answer:
      "Yes. At checkout, choose \"Sending as a Gift\" and enable the Anonymous option. Recipient-facing labels and packing slips won't include your name — only what you choose to share in your gift note.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Orders begin processing within 24 hours of payment. Vendors have 12 hours to deliver to our hub, where every item passes a 3-point quality check before white-glove dispatch. Most orders arrive within 72 hours; if delayed, we'll notify you immediately.",
  },
  {
    question: "What is your minimum order value?",
    answer:
      "Luxury gifting orders start from ₦50,000. After Dark orders start from ₦20,000. These thresholds help us maintain premium packaging, vetting, and service standards.",
  },
  {
    question: "What is your returns policy?",
    answer:
      "If a product arrives faulty or not as described — and the issue wasn't caused after delivery — contact us within 48 hours. We'll arrange a replacement or refund after inspection at our hub. Personalized or intimate items may have additional restrictions for hygiene reasons.",
  },
  {
    question: "How do I track my order?",
    answer:
      "After checkout you'll receive an order confirmation with a tracking link. You can also visit Track Order and enter your order reference, or check the link in your confirmation email.",
  },
] as const;

export const DELIVERY_SECTIONS = [
  {
    title: "Our delivery promise",
    body: "Most Kay orders arrive within 72 hours of payment. We partner with white-glove logistics providers who handle delicate, high-value items — not standard parcel services.",
  },
  {
    title: "How it works",
    steps: [
      "You place your order and payment is confirmed.",
      "We notify the vendor — they have 12 hours to deliver to the Kay hub.",
      "Our team runs a 3-point inspection: quality, seal integrity, and accuracy.",
      "Your gift is packaged in Kay luxury wrapping and dispatched discreetly.",
    ],
  },
  {
    title: "3-point quality check",
    steps: [
      "Quality inspection on arrival at our hub.",
      "Seal and tamper verification — nothing leaves if integrity is compromised.",
      "Vendor accountability — faults not caused by the customer qualify for replacement or refund.",
    ],
  },
  {
    title: "If we're delayed",
    body: "No system is perfect. If your order is delayed, we'll message you immediately, apologise, and aim to deliver within an additional 24 hours.",
  },
] as const;

export const RETURNS_SECTIONS = [
  {
    title: "Eligible returns",
    body: "Products that arrive damaged, defective, or materially different from their listing may be returned within 48 hours of delivery. Items must be unused and in original packaging where applicable.",
  },
  {
    title: "Non-returnable items",
    body: "For hygiene and safety, certain intimate wellness products, personalised items, and perishables cannot be returned unless faulty on arrival.",
  },
  {
    title: "How to start a return",
    body: "Contact our team via the Contact page with your order reference and photos of the issue. We'll guide you through the next steps after hub inspection.",
  },
] as const;

export const CONTACT_CHANNELS = [
  {
    label: "Email",
    value: "hello@kaystores.com",
    href: "mailto:hello@kaystores.com",
  },
  {
    label: "WhatsApp",
    value: "+234 800 KAY GIFT",
    href: "https://wa.me/2348000000000",
  },
  {
    label: "Concierge",
    value: "Special sourcing requests",
    href: "/concierge",
  },
] as const;
