import type { Metadata } from "next";
import { getInternalApiUrl } from "@/lib/internal-api";
import CategoryClient, { type CategoryResponse } from "./_components/category-client";

export const metadata: Metadata = {
  title: "Admin • Categories",
  description: "Organize products into curated collections and sections.",
};

export const dynamic = "force-dynamic";

async function getCategories(): Promise<CategoryResponse[]> {
  try {
    const res = await fetch(getInternalApiUrl("/api/admin/category"), {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("[ADMIN_CATEGORY_PAGE]", error);
    return [];
  }
}

const CategoryPage = async () => {
  const categories = await getCategories();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
        <p className="text-sm text-slate-500">Curate category groups to guide shoppers through your store.</p>
      </div>
      <CategoryClient initialCategories={categories} />
    </div>
  );
};

export default CategoryPage;
