"use client";

import { useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageKitUpload, { type ImageKitUploadValue } from "@/components/ui/imagekit-upload";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";

const imageItemSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1),
  name: z.string().optional(),
  size: z.number().optional(),
  thumbnailUrl: z.string().optional().nullable(),
});

const categoryFormSchema = z.object({
  name: z.string().min(1, "Required"),
  slug: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphen only"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isPublished: z.boolean(),
  image: imageItemSchema.nullable().optional(),
});

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
};

type CategoryImageResponse = {
  url: string;
  fileId: string;
  name?: string | null;
  thumbnailUrl?: string | null;
};

type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  isPublished: boolean;
  imageUrl: string | null;
  imageFileId: string | null;
  image: CategoryImageResponse | null;
  createdAt: string;
};

const mapCategoryToForm = (category: CategoryResponse) => ({
  name: category.name,
  slug: category.slug,
  description: category.description ?? "",
  parentId: category.parentId ?? "",
  isPublished: category.isPublished,
  image:
    category.image?.url && category.image?.fileId
      ? {
          url: category.image.url,
          fileId: category.image.fileId,
          name: category.image.name ?? undefined,
          thumbnailUrl: category.image.thumbnailUrl ?? undefined,
        }
      : category.imageUrl && category.imageFileId
        ? {
            url: category.imageUrl,
            fileId: category.imageFileId,
          }
        : null,
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const defaultValues: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
  isPublished: true,
  image: null,
};

type CategoryClientProps = {
  initialCategories?: CategoryResponse[];
};

const CategoryClient = ({ initialCategories }: CategoryClientProps) => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);

  const { data: categories = [], isFetching: categoriesLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => fetcher<CategoryResponse[]>("/api/admin/category"),
    initialData: initialCategories,
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CategoryFormValues) => {
      const { image, ...rest } = payload;

      const response = await fetch("/api/admin/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          description: rest.description?.trim() ? rest.description.trim() : null,
          parentId: rest.parentId ? rest.parentId : null,
          image: image ? { url: image.url, fileId: image.fileId } : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to create category" }));
        throw new Error(body.message ?? "Unable to create category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: CategoryFormValues) => {
      if (!selectedCategory) return;

      const { image, ...rest } = payload;

      const response = await fetch(`/api/admin/category/${selectedCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          description: rest.description?.trim() ? rest.description.trim() : null,
          parentId: rest.parentId ? rest.parentId : null,
          image: image ? { url: image.url, fileId: image.fileId } : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to update category" }));
        throw new Error(body.message ?? "Unable to update category");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSelectedCategory(data);
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategory) return;

      const response = await fetch(`/api/admin/category/${selectedCategory.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to delete category" }));
        throw new Error(body.message ?? "Unable to delete category");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      resetForm();
    },
  });

  function resetForm() {
    form.reset(defaultValues);
    setSelectedCategory(null);
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  }

  const mutationError =
    (createMutation.error as Error | undefined) ||
    (updateMutation.error as Error | undefined) ||
    (deleteMutation.error as Error | undefined);

  const enrichedCategories = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      childCount: categories.filter((item) => item.parentId === category.id).length,
    }));
  }, [categories]);

  const onSubmit: SubmitHandler<CategoryFormValues> = (values) => {
    if (selectedCategory) {
      return updateMutation.mutate(values);
    }

    return createMutation.mutate(values);
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Category library</h2>
            <p className="text-sm text-slate-500">
              {categoriesLoading ? "Loading categories…" : `${formatNumber(categories.length)} total groups`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })}>
              <RefreshCcw className="mr-1 h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={resetForm}>
              <Plus className="mr-1 h-4 w-4" /> New category
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Children</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrichedCategories.map((category) => {
                const isSelected = selectedCategory?.id === category.id;
                return (
                  <tr
                    key={category.id}
                    className={cn("cursor-pointer transition hover:bg-slate-50", isSelected ? "bg-slate-900/5" : "")}
                    onClick={() => {
                      setSelectedCategory(category);
                      form.reset(mapCategoryToForm(category));
                    }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                      <p className="text-xs text-slate-500">/{category.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {category.parent ? category.parent.name : "Root"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{category.childCount}</td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {category.isPublished ? "Published" : "Draft"}
                    </td>
                  </tr>
                );
              })}
              {enrichedCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    {categoriesLoading ? "Loading categories…" : "No categories yet. Create your first grouping."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedCategory ? "Update category" : "Create category"}
              </h2>
              <p className="text-sm text-slate-500">Organize products by publishing curated collections.</p>
            </div>
            {selectedCategory ? (
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                aria-label="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <Form {...form}>
            <form className="mt-6 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              {mutationError ? (
                <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-600">{mutationError.message}</p>
              ) : null}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer essentials" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="summer-essentials" {...field} />
                    </FormControl>
                    <FormDescription>Used in category URLs.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Tell buyers what lives here." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category image</FormLabel>
                    <FormDescription>Appears on storefront category headers and promotions.</FormDescription>
                    <FormControl>
                      <ImageKitUpload
                        value={field.value ? [field.value as ImageKitUploadValue] : []}
                        onChange={(next) => field.onChange(next[0] ?? null)}
                        multiple={false}
                        maxFiles={1}
                        folder="/categories"
                        emptyHint="Use high-resolution imagery for best results"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent category</FormLabel>
                    <FormControl>
                      <select
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        <option value="">No parent</option>
                        {categories
                          .filter((option) => option.id !== selectedCategory?.id)
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <FormDescription>Nest categories for navigational clarity.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                    <div>
                      <FormLabel className="text-sm font-semibold">Publish category</FormLabel>
                      <FormDescription>Draft categories stay hidden from shoppers.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm} disabled={createMutation.isPending || updateMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {selectedCategory ? "Save changes" : "Create category"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {selectedCategory ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Insights</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Created</dt>
                <dd>{new Date(selectedCategory.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd>{selectedCategory.isPublished ? "Published" : "Draft"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CategoryClient;
export type { CategoryResponse };
