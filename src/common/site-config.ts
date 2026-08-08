export const siteConfig = {
  name: "Aarnav Scientific",
  brand: "Quanta Chem",
  tagline: "Precision Chemicals. Global Trust.",
  description:
    "Aarnav Scientific (Quanta Chem) is an ISO 9001:2015 certified manufacturer, importer and exporter of laboratory reagents, fine chemicals and specialty chemicals serving pharmaceutical, food, cosmetics, agriculture, industrial and water-treatment industries worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.aarnavscientific.co.in",
  email: "sales@aarnavscientific.co.in",
  phone: "+91 96198 45188",
  whatsapp: "919619845188",
  address: {
    line1: "Office No-105, Plot no- 75, Sector-17",
    line2: "Vardhaman market, Vashi",
    city: "Navi-Mumbai",
    state: "Maharashtra",
    pincode: "400703",
    country: "India",
  },
  coords: { lat: 19.0624089048394, lng: 72.92185714232721 },
  social: {
    linkedin: "https://linkedin.com",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
  },
  legal: {
    iso: "ISO 9001:2015 — Certificate No. QMS/30AF/1024",
    udyam: "UDYAM-MH-18-0391807 (Micro Enterprise)",
    iec: "AVQPV4609K",
  },
} as const;

export interface NavItem {
  readonly title: string;
  readonly href: string;
  readonly megaMenu?: boolean;
  readonly children?: readonly { readonly title: string; readonly href: string }[];
}

export const mainNav: readonly NavItem[] = [
  { title: "Home", href: "/" },
  {
    title: "About",
    href: "/about",
    children: [
      { title: "Company Story", href: "/about" },
      { title: "Infrastructure", href: "/about/infrastructure" },
      { title: "Quality Policy", href: "/about/quality-policy" },
      { title: "Certifications & Downloads", href: "/certifications" },
    ],
  },
  {
    title: "Products",
    href: "/products",
    megaMenu: true,
  },
  {
    title: "Industries",
    href: "/industries",
    megaMenu: true,
  },
  {
    title: "Packaging",
    href: "/manufacturing",
  },
  {
    title: "Export",
    href: "/export",
  },
  { title: "Blog", href: "/blog" },
  { title: "Contact", href: "/contact" },
] as const;

export const industriesList = [
  {
    slug: "pharmaceuticals",
    name: "Pharmaceuticals",
    summary:
      "High-purity reagents, excipients and process chemicals for pharmaceutical manufacturing and QC labs.",
    icon: "Pill",
  },
  {
    slug: "food",
    name: "Food",
    summary:
      "Food-grade chemicals and additives manufactured under strict quality and safety protocols.",
    icon: "UtensilsCrossed",
  },
  {
    slug: "cosmetics",
    name: "Cosmetics",
    summary:
      "Specialty ingredients and raw materials for cosmetic and personal-care formulations.",
    icon: "Sparkles",
  },
  {
    slug: "agriculture",
    name: "Agriculture",
    summary:
      "Agrochemical intermediates and inputs supporting crop protection and soil science.",
    icon: "Wheat",
  },
  {
    slug: "laboratory",
    name: "Laboratory",
    summary:
      "AR/LR/HPLC grade reagents trusted by research, academic and QC laboratories nationwide.",
    icon: "FlaskConical",
  },
  {
    slug: "industrial-chemicals",
    name: "Industrial Chemicals",
    summary: "Bulk industrial-grade chemicals for manufacturing and process industries.",
    icon: "Factory",
  },
  {
    slug: "water-treatment",
    name: "Water Treatment",
    summary: "Chemicals and reagents used in water testing, purification and treatment.",
    icon: "Droplets",
  },
  {
    slug: "specialty-chemicals",
    name: "Specialty Chemicals",
    summary: "Custom-synthesis and niche specialty chemicals tailored to customer requirements.",
    icon: "TestTubes",
  },
] as const;

export const productCategoriesList = [
  { slug: "acids", name: "Acids", icon: "Beaker" },
  { slug: "solvents", name: "Solvents", icon: "Droplet" },
  { slug: "organic-chemicals", name: "Organic Chemicals", icon: "Atom" },
  { slug: "inorganic-chemicals", name: "Inorganic Chemicals", icon: "Gem" },
  { slug: "food-chemicals", name: "Food Chemicals", icon: "Apple" },
  { slug: "pharmaceutical-chemicals", name: "Pharmaceutical Chemicals", icon: "Pill" },
  { slug: "laboratory-chemicals", name: "Laboratory Chemicals", icon: "FlaskConical" },
  { slug: "water-treatment-chemicals", name: "Water Treatment Chemicals", icon: "Droplets" },
] as const;