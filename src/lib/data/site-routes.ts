export const SITE_ROUTES = {
  about: "/about",
  ourStory: "/about",
  faqs: "/faqs",
  deliveryReturns: "/delivery-returns",
  trackOrder: "/track-order",
  contact: "/contact",
  careers: "/careers",
  press: "/press",
  sustainability: "/sustainability",
  privacy: "/privacy",
  terms: "/terms",
  concierge: "/concierge",
  afterDark: "/after-dark",
} as const;

export const FOOTER_HELP_LINKS: Record<string, string> = {
  FAQs: SITE_ROUTES.faqs,
  "Delivery & Returns": SITE_ROUTES.deliveryReturns,
  "Track Order": SITE_ROUTES.trackOrder,
  "Contact Us": SITE_ROUTES.contact,
};

export const FOOTER_ABOUT_LINKS: Record<string, string> = {
  "Our Story": SITE_ROUTES.about,
  "Private collection (18+)": SITE_ROUTES.afterDark,
  Careers: SITE_ROUTES.careers,
  Press: SITE_ROUTES.press,
  Sustainability: SITE_ROUTES.sustainability,
};
