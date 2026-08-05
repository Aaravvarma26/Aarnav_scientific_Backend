"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Save, X, Plus } from "lucide-react";
import { Label } from "@/components/common/label";
import { Input } from "@/components/common/input";
import { Textarea } from "@/components/common/textarea";
import { Select } from "@/components/common/select";
import { useToast } from "@/components/common/toast";

type Category = { id: string; name: string };

type ProductFormValues = {
  sku: string;
  name: string;
  casNumber?: string;
  hsnCode?: string;
  unNumber?: string;
  chemicalFormula?: string;
  molecularWeight?: string;
  purity?: string;
  appearance?: string;
  applications?: string;
  safetyInfo?: string;
  storageConditions?: string;
  description?: string;
  categoryId?: string;
  seoTitle?: string;
  seoDescription?: string;
  isFeatured: boolean;
  isPopular: boolean;
  isActive: boolean;
};

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [packSizes, setPackSizes] = useState<string[]>([]);
  const [newPack, setNewPack] = useState("");
  const [loading, setLoading] = useState(!!productId);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProductFormValues>({
    defaultValues: { isActive: true, isFeatured: false, isPopular: false },
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          reset({ ...d.product, categoryId: d.product.categoryId || "" });
          setPackSizes(d.product.packSizes?.map((p: { label: string }) => p.label) || []);
        }
      })
      .finally(() => setLoading(false));
  }, [productId, reset]);

  async function onSubmit(values: ProductFormValues) {
    const payload = { ...values, packSizes };
    const res = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
      method: productId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      push(data.error || "Failed to save product", "error");
      return;
    }
    push(productId ? "Product updated" : "Product created");
    router.push("/admin/products");
    router.refresh();
  }

  if (loading) return <p className="text-navy-400">Loading…</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Section title="Basic Information">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>SKU *</Label>
            <Input {...register("sku", { required: true })} />
          </div>
          <div>
            <Label>Product Name *</Label>
            <Input {...register("name", { required: true })} />
          </div>
          <div>
            <Label>Category</Label>
            <Select {...register("categoryId")}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>CAS Number</Label>
            <Input {...register("casNumber")} />
          </div>
          <div>
            <Label>HSN Code</Label>
            <Input {...register("hsnCode")} />
          </div>
          <div>
            <Label>UN Number</Label>
            <Input {...register("unNumber")} />
          </div>
          <div>
            <Label>Chemical Formula</Label>
            <Input {...register("chemicalFormula")} />
          </div>
          <div>
            <Label>Molecular Weight</Label>
            <Input {...register("molecularWeight")} />
          </div>
          <div>
            <Label>Purity</Label>
            <Input {...register("purity")} />
          </div>
          <div>
            <Label>Appearance</Label>
            <Input {...register("appearance")} />
          </div>
        </div>
      </Section>

      <Section title="Pack Sizes">
        <div className="flex flex-wrap gap-2">
          {packSizes.map((p, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-full bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700">
              {p}
              <button type="button" onClick={() => setPackSizes(packSizes.filter((_, idx) => idx !== i))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={newPack} onChange={(e) => setNewPack(e.target.value)} placeholder="e.g. 500GM" className="max-w-[160px]" />
          <button
            type="button"
            onClick={() => {
              if (newPack.trim()) {
                setPackSizes([...packSizes, newPack.trim()]);
                setNewPack("");
              }
            }}
            className="btn-secondary !px-4 !py-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </Section>

      <Section title="Detailed Content">
        <div className="space-y-5">
          <div>
            <Label>Description</Label>
            <Textarea rows={3} {...register("description")} />
          </div>
          <div>
            <Label>Applications</Label>
            <Textarea rows={3} {...register("applications")} />
          </div>
          <div>
            <Label>Safety Information</Label>
            <Textarea rows={3} {...register("safetyInfo")} />
          </div>
          <div>
            <Label>Storage Conditions</Label>
            <Textarea rows={2} {...register("storageConditions")} />
          </div>
        </div>
      </Section>

      <Section title="SEO">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>SEO Title</Label>
            <Input {...register("seoTitle")} />
          </div>
          <div>
            <Label>SEO Description</Label>
            <Input {...register("seoDescription")} />
          </div>
        </div>
      </Section>

      <Section title="Visibility">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded border-navy-300 text-teal-600" /> Active
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" {...register("isFeatured")} className="h-4 w-4 rounded border-navy-300 text-teal-600" /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" {...register("isPopular")} className="h-4 w-4 rounded border-navy-300 text-teal-600" /> Popular
          </label>
        </div>
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" /> {productId ? "Save Changes" : "Create Product"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-navy-500">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
