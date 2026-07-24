export interface NavLink {
  href: string;
  label: string;
}

/** Single source for the header, the mobile disclosure, and the footer. */
export const NAV_LINKS: NavLink[] = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#stack", label: "Stack" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];
