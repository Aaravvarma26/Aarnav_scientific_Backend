"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { Label } from "@/components/common/label";
import { Input } from "@/components/common/input";
import { Textarea } from "@/components/common/textarea";
import { Select } from "@/components/common/select";
import { useToast } from "@/components/common/toast";

type FormValues = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  status: "DRAFT" | "PUBLISHED";
  categoryName?: string;
  tags?: string | string[];
  seoTitle?: string;
  seoDescription?: string;
};

export function BlogPostForm({ postId }: { postId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(!!postId);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { status: "DRAFT" },
  });

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/admin/blog/${postId}`)
      .then((r) => r.json())
      .then((d) => d.post && reset(d.post))
      .finally(() => setLoading(false));
  }, [postId, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      tags:
        typeof values.tags === "string"
          ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : values.tags,
    };
    const res = await fetch(postId ? `/api/admin/blog/${postId}` : "/api/admin/blog", {
      method: postId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      push(data.error || "Failed to save post", "error");
      return;
    }
    push(postId ? "Post updated" : "Post created");
    router.push("/admin/blog");
    router.refresh();
  }

  if (loading) return <p className="text-navy-400">Loading…</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
        <div className="space-y-5">
          <div>
            <Label>Title *</Label>
            <Input {...register("title", { required: true })} />
          </div>
          <div>
            <Label>URL Slug</Label>
            <Input {...register("slug")} placeholder="auto-generated from title if left blank" />
          </div>
          <div>
            <Label>Excerpt</Label>
            <Textarea rows={2} {...register("excerpt")} />
          </div>
          <div>
            <Label>Content * (Markdown supported)</Label>
            <Textarea rows={14} {...register("content", { required: true })} className="font-mono text-xs" />
          </div>
          <div>
            <Label>Featured Image URL</Label>
            <Input {...register("featuredImage")} placeholder="/uploads/… or full URL" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Input {...register("categoryName")} placeholder="e.g. Export & Compliance" />
            </div>
            <div>
              <Label>Tags</Label>
              <Input {...register("tags")} placeholder="comma-separated, e.g. exporting, compliance" />
            </div>
          </div>
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
          <div>
            <Label>Status</Label>
            <Select {...register("status")}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" /> {postId ? "Save Changes" : "Create Post"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}