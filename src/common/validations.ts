import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const inquirySchema = z.object({
  companyName: z.string().min(2, "Company name is required").max(200),
  contactPerson: z.string().min(2, "Contact person is required").max(120),
  country: z.string().max(100).optional(),
  phone: z.string().min(6, "Enter a valid phone number").max(30),
  email: z.string().email("Enter a valid email address"),
  productId: z.string().optional(),
  productName: z.string().optional(),
  quantity: z.string().max(100).optional(),
  message: z.string().min(10, "Please provide a bit more detail").max(4000),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(4000),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export const productSchema = z.object({
  sku: z.string().min(2).max(30),
  name: z.string().min(2).max(300),
  slug: z.string().min(2).max(300).optional(),
  casNumber: z.string().max(50).optional().nullable(),
  hsnCode: z.string().max(20).optional().nullable(),
  unNumber: z.string().max(30).optional().nullable(),
  chemicalFormula: z.string().max(120).optional().nullable(),
  molecularWeight: z.string().max(60).optional().nullable(),
  purity: z.string().max(60).optional().nullable(),
  appearance: z.string().max(200).optional().nullable(),
  applications: z.string().max(5000).optional().nullable(),
  safetyInfo: z.string().max(5000).optional().nullable(),
  storageConditions: z.string().max(2000).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  subcategoryId: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
  packSizes: z.array(z.string()).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(150).optional(),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  iconName: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const blogPostSchema = z.object({
  title: z.string().min(3).max(300),
  slug: z
    .string()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.trim().length >= 3 ? v.trim() : undefined)),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(10),
  featuredImage: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  categoryName: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
});

export const userSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  roleName: z.enum(["ADMIN", "EDITOR", "SALES"]),
  isActive: z.boolean().optional(),
});

export function paginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}