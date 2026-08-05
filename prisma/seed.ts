import { PrismaClient, RoleName, DownloadType } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import fs from "node:fs";
import path from "node:path";
import { consolidateRawProducts, type RawProduct } from "../scripts/catalog-utils";

const prisma = new PrismaClient();


const CATEGORY_META: Record<string, { slug: string; description: string }> = {
  Acids: {
    slug: "acids",
    description:
      "Organic and inorganic acids in AR, LR and technical grades for laboratory, industrial and manufacturing use.",
  },
  Solvents: {
    slug: "solvents",
    description:
      "HPLC, AR and LR grade solvents including alcohols, ketones, chlorinated and aromatic solvents.",
  },
  "Organic Chemicals": {
    slug: "organic-chemicals",
    description:
      "A broad portfolio of organic fine chemicals and intermediates for research and industrial synthesis.",
  },
  "Inorganic Chemicals": {
    slug: "inorganic-chemicals",
    description:
      "Salts, oxides, metals and inorganic compounds manufactured and supplied in multiple pack sizes.",
  },
  "Food Chemicals": {
    slug: "food-chemicals",
    description: "Food-grade chemicals and additives manufactured to strict quality standards.",
  },
  "Pharmaceutical Chemicals": {
    slug: "pharmaceutical-chemicals",
    description: "Pharma-grade reagents and excipients for the pharmaceutical industry.",
  },
  "Laboratory Chemicals": {
    slug: "laboratory-chemicals",
    description:
      "Buffers, indicators, stains, reagents and culture media for research and QC laboratories.",
  },
  "Water Treatment Chemicals": {
    slug: "water-treatment-chemicals",
    description: "Chemicals and reagents used in water testing, purification and treatment.",
  },
};

async function main() {
  console.log("Seeding database…");

  // -------------------------------------------------------------------
  // 1. Permissions & Roles
  // -------------------------------------------------------------------
  const permissionKeys = [
    "product:create", "product:read", "product:update", "product:delete",
    "category:manage", "blog:manage", "media:manage", "download:manage",
    "certificate:manage", "testimonial:manage", "partner:manage",
    "homepage:manage", "inquiry:read", "inquiry:update",
    "user:manage", "settings:manage", "audit:read",
  ];
  await Promise.all(
    permissionKeys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, label: key.replace(":", " · ") },
      })
    )
  );
  const allPermissions = await prisma.permission.findMany();

  const roleAdmin = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
      description: "Full access to all modules",
      permissions: { connect: allPermissions.map((p) => ({ id: p.id })) },
    },
  });

  const editorPermKeys = [
    "product:create", "product:read", "product:update", "product:delete",
    "category:manage", "blog:manage", "media:manage", "download:manage",
    "certificate:manage", "testimonial:manage", "partner:manage",
    "homepage:manage",
  ];
  await prisma.role.upsert({
    where: { name: RoleName.EDITOR },
    update: {},
    create: {
      name: RoleName.EDITOR,
      description: "Manages content, products and media",
      permissions: {
        connect: allPermissions.filter((p) => editorPermKeys.includes(p.key)).map((p) => ({ id: p.id })),
      },
    },
  });

  await prisma.role.upsert({
    where: { name: RoleName.SALES },
    update: {},
    create: {
      name: RoleName.SALES,
      description: "Manages inquiries and views the product catalogue",
      permissions: {
        connect: allPermissions
          .filter((p) => ["inquiry:read", "inquiry:update", "product:read"].includes(p.key))
          .map((p) => ({ id: p.id })),
      },
    },
  });

  // -------------------------------------------------------------------
  // 2. Admin user
  // -------------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@aarnavscientific.co.in";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe@12345";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Aarnav Scientific Admin",
      email: adminEmail,
      passwordHash,
      roleId: roleAdmin.id,
    },
  });
  console.log(`Admin user ready: ${adminEmail}`);

  // -------------------------------------------------------------------
  // 3. Categories
  // -------------------------------------------------------------------
  const categoryMap = new Map<string, string>(); // name -> id
  for (const [name, meta] of Object.entries(CATEGORY_META)) {
    const cat = await prisma.category.upsert({
      where: { slug: meta.slug },
      update: { description: meta.description },
      create: {
        name,
        slug: meta.slug,
        description: meta.description,
        isFeatured: true,
      },
    });
    categoryMap.set(name, cat.id);
  }

  // -------------------------------------------------------------------
  // 4. Products (consolidated catalogue import)
  // -------------------------------------------------------------------
  const dataPath = path.join(__dirname, "products_seed_data.json");
  const rawProducts: RawProduct[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const products = consolidateRawProducts(rawProducts);
  const duplicateCount = rawProducts.length - products.length;

  console.log(
    `Importing ${products.length} unique products from ${rawProducts.length} catalogue rows ` +
      `(${duplicateCount} pack-size duplicates consolidated)…`
  );

  const usedSlugs = new Set<string>();
  let created = 0;
  const BATCH = 100;

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);

    for (const product of batch) {
      let baseSlug = slugify(`${product.name}-${product.sku}`, {
        lower: true,
        strict: true,
      });
      if (!baseSlug) baseSlug = product.sku.toLowerCase();

      let slug = baseSlug;
      let counter = 1;
      while (usedSlugs.has(slug)) slug = `${baseSlug}-${counter++}`;
      usedSlugs.add(slug);

      const categoryId = categoryMap.get(product.category);
      const productName = titleCase(product.name);
      const productImageUrl = `/images/products/${product.sku.toLowerCase()}.webp`;

      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {
          slug,
          name: productName,
          casNumber: product.cas && product.cas !== "---" ? product.cas : null,
          hsnCode: product.hsn || null,
          unNumber: product.un_no && product.un_no !== "NA/NA" ? product.un_no : null,
          categoryId,
          isActive: true,
          packSizes: {
            deleteMany: {},
            create: product.pack_sizes.map((label) => ({ label })),
          },
          images: {
            deleteMany: { url: { startsWith: "/images/products/" } },
            create: {
              url: productImageUrl,
              altText: `${productName} molecular structure`,
              sortOrder: -100,
            },
          },
        },
        create: {
          sku: product.sku,
          slug,
          name: productName,
          casNumber: product.cas && product.cas !== "---" ? product.cas : null,
          hsnCode: product.hsn || null,
          unNumber: product.un_no && product.un_no !== "NA/NA" ? product.un_no : null,
          appearance: null,
          categoryId,
          isActive: true,
          packSizes: {
            create: product.pack_sizes.map((label) => ({ label })),
          },
          images: {
            create: {
              url: productImageUrl,
              altText: `${productName} molecular structure`,
              sortOrder: -100,
            },
          },
        },
      });
    }

    created += batch.length;
    process.stdout.write(`\r  …${created}/${products.length}`);
  }
  console.log(`\nImported ${created} unique products.`);

  // Mark a handful as featured/popular for the homepage
  const someProducts = await prisma.product.findMany({ take: 12, orderBy: { createdAt: "asc" } });
  await Promise.all(
    someProducts.slice(0, 8).map((prod) =>
      prisma.product.update({ where: { id: prod.id }, data: { isFeatured: true } })
    )
  );
  await Promise.all(
    someProducts.slice(4).map((prod) =>
      prisma.product.update({ where: { id: prod.id }, data: { isPopular: true } })
    )
  );

  // -------------------------------------------------------------------
  // 5. Industries
  // -------------------------------------------------------------------
  const industries = [
    { slug: "pharmaceuticals", name: "Pharmaceuticals", summary: "High-purity reagents and excipients for pharmaceutical manufacturing and QC." },
    { slug: "food", name: "Food", summary: "Food-grade chemicals and additives manufactured under strict quality protocols." },
    { slug: "cosmetics", name: "Cosmetics", summary: "Specialty ingredients for cosmetic and personal-care formulations." },
    { slug: "agriculture", name: "Agriculture", summary: "Agrochemical intermediates supporting crop protection and soil science." },
    { slug: "laboratory", name: "Laboratory", summary: "AR/LR/HPLC grade reagents trusted by research and QC laboratories." },
    { slug: "industrial-chemicals", name: "Industrial Chemicals", summary: "Bulk industrial-grade chemicals for manufacturing and process industries." },
    { slug: "water-treatment", name: "Water Treatment", summary: "Chemicals and reagents for water testing, purification and treatment." },
    { slug: "specialty-chemicals", name: "Specialty Chemicals", summary: "Custom-synthesis and niche specialty chemicals for unique requirements." },
  ];
  for (const [i, ind] of industries.entries()) {
    await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: {},
      create: { ...ind, sortOrder: i },
    });
  }

  // -------------------------------------------------------------------
  // 6. Certificates
  // -------------------------------------------------------------------
  await prisma.certificate.createMany({
    data: [
      {
        title: "ISO 9001:2015 — Quality Management System",
        issuer: "Quality Control Certification (QCC), UK",
        certNumber: "QMS/30AF/1024",
        issueDate: new Date("2024-10-25"),
        expiryDate: new Date("2027-10-24"),
        imageUrl: "/images/certificates/iso-9001-2015.jpg",
        fileUrl: "/documents/ISO-9001-2015-Certificate.pdf",
        sortOrder: 1,
      },
      {
        title: "Udyam (MSME) Registration Certificate",
        issuer: "Ministry of Micro, Small & Medium Enterprises, Govt. of India",
        certNumber: "UDYAM-MH-18-0391807",
        issueDate: new Date("2024-11-22"),
        imageUrl: "/images/certificates/msme-udyam.jpg",
        fileUrl: "/documents/MSME-Udyam-Certificate.pdf",
        sortOrder: 2,
      },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------
  // 7. Homepage sections
  // -------------------------------------------------------------------
  const sections = [
    { key: "hero", title: "Precision Chemicals. Global Trust.", subtitle: "Manufacturing & exporting laboratory reagents and fine chemicals since 2017." },
    { key: "why-choose-us", title: "Why Choose Aarnav Scientific" },
    { key: "featured-products", title: "Featured Products" },
    { key: "industries-served", title: "Industries We Serve" },
    { key: "global-presence", title: "Our Global Presence" },
    { key: "certificates", title: "Certifications & Compliance" },
    { key: "manufacturing", title: "Manufacturing Capabilities" },
    { key: "testimonials", title: "What Our Partners Say" },
    { key: "partners", title: "Trusted By" },
  ];
  for (const [i, s] of sections.entries()) {
    await prisma.homepageSection.upsert({
      where: { key: s.key },
      update: {},
      create: { ...s, sortOrder: i },
    });
  }

  // -------------------------------------------------------------------
  // 8. Countries served (sample export markets)
  // -------------------------------------------------------------------
  const countries = [
    "India", "United Arab Emirates", "United States", "United Kingdom", "Germany",
    "Bangladesh", "Sri Lanka", "Nepal", "Kenya", "South Africa", "Vietnam",
    "Indonesia", "Saudi Arabia", "Nigeria", "Brazil", "Malaysia", "Ethiopia",
    "Jordan", "Egypt", "Thailand", "Singapore", "Uganda", "Sudan", "Mauritius",
    "Iran", "Oman", "Bahrain", "Myanmar", "Cambodia", "Burundi", "Malawi",
    "Rwanda", "Zambia",
  ];
  for (const [i, name] of countries.entries()) {
    await prisma.country.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
  }

  // -------------------------------------------------------------------
  // 9. Testimonials (placeholder — replace via admin panel)
  // -------------------------------------------------------------------
  await prisma.testimonial.createMany({
    data: [
      {
        name: "Procurement Manager",
        company: "Pharmaceutical Manufacturer",
        country: "India",
        message:
          "Consistent quality and on-time delivery on every order. Their documentation (COA/MSDS) is always in order, which makes our audits far easier.",
        rating: 5,
      },
      {
        name: "QA Head",
        company: "Contract Research Laboratory",
        country: "India",
        message:
          "We have sourced HPLC-grade solvents from Aarnav Scientific for over two years — reliable purity and responsive technical support.",
        rating: 5,
      },
      {
        name: "Export Manager",
        company: "Specialty Chemicals Distributor",
        country: "UAE",
        message:
          "Smooth export documentation and packaging that consistently meets international shipping standards.",
        rating: 5,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete.");
}

function titleCase(s: string) {
  // Preserve already-good acronyms/casing; only fix ALL-CAPS names for readability
  if (s === s.toUpperCase()) {
    return s
      .toLowerCase()
      .split(" ")
      .map((w) => (w.length <= 3 && w === w.toLowerCase() ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(" ")
      .replace(/\bHplc\b/gi, "HPLC")
      .replace(/\bAr\b/g, "AR")
      .replace(/\bLr\b/g, "LR")
      .replace(/\bGr\b/g, "GR")
      .replace(/\bIp\b/g, "IP")
      .replace(/\bUsp\b/gi, "USP")
      .replace(/\bBp\b/g, "BP")
      .replace(/\bPh\b/g, "pH");
  }
  return s;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });