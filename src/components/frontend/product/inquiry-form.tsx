"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/common/label";
import { Input } from "@/components/common/input";
import { Textarea } from "@/components/common/textarea";
import { useToast } from "@/components/common/toast";
import { Loader2, Paperclip, CheckCircle2 } from "lucide-react";

const schema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  country: z.string().optional(),
  phone: z.string().min(6, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  quantity: z.string().optional(),
  message: z.string().min(10, "Please provide a bit more detail"),
});
type FormValues = z.infer<typeof schema>;

export function InquiryForm() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") || "";
  const productName = searchParams.get("productName") || "";
  const { push } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const form = new FormData();
      Object.entries(values).forEach(([k, v]) => form.append(k, v || ""));
      if (productId) form.append("productId", productId);
      if (productName) form.append("productName", productName);
      if (file) form.append("attachment", file);

      const res = await fetch("/api/inquiries", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      setSubmitted(true);
      reset();
      push("Inquiry submitted successfully");
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed to submit inquiry", "error");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-navy-100 bg-white p-12 text-center shadow-card">
        <CheckCircle2 className="h-12 w-12 text-teal-600" />
        <h3 className="mt-4 font-display text-xl font-semibold text-navy-900">Thank you!</h3>
        <p className="mt-2 max-w-sm text-sm text-navy-600">
          Your inquiry has been received. Our team will get back to you within one business day.
        </p>
        <button onClick={() => setSubmitted(false)} className="btn-secondary mt-6">
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-navy-100 bg-white p-8 shadow-card">
      {productName && (
        <div className="mb-6 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Inquiring about: <strong>{decodeURIComponent(productName)}</strong>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="companyName">Company Name *</Label>
          <Input id="companyName" {...register("companyName")} placeholder="Your company" />
          {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>}
        </div>
        <div>
          <Label htmlFor="contactPerson">Contact Person *</Label>
          <Input id="contactPerson" {...register("contactPerson")} placeholder="Full name" />
          {errors.contactPerson && <p className="mt-1 text-xs text-red-600">{errors.contactPerson.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} placeholder="you@company.com" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" {...register("phone")} placeholder="+1 234 567 8901" />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register("country")} placeholder="Country" />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity Required</Label>
          <Input id="quantity" {...register("quantity")} placeholder="e.g. 500 KG" />
        </div>
      </div>

      <div className="mt-5">
        <Label htmlFor="message">Message *</Label>
        <Textarea id="message" rows={5} {...register("message")} placeholder="Tell us about your requirement…" />
        {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
      </div>

      <div className="mt-5">
        <Label>Attachment (optional)</Label>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-navy-300 px-4 py-3 text-sm text-navy-500 hover:border-teal-500">
          <Paperclip className="h-4 w-4" />
          {file ? file.name : "Attach a spec sheet or PO (PDF/image, max 10MB)"}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary mt-7 w-full sm:w-auto">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Inquiry
      </button>
    </form>
  );
}
