import type { Metadata } from "next";
import { getInternalApiUrl } from "@/lib/internal-api";
import ProductsClient, {
  type CategoryResponse,
  type ProductResponse,
} from "./_components/products-client";

export const metadata: Metadata = {
  title: "Admin • Products",
  description: "Manage catalog items, pricing, and inventory.",
};

export const dynamic = "force-dynamic";

async function getProducts(): Promise<ProductResponse[]> {
  try {
    const res = await fetch(getInternalApiUrl("/api/admin/products"), {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_PAGE]", error);
    return [];
  }
}

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
    console.error("[ADMIN_CATEGORIES_PAGE]", error);
    return [];
  }
}

const ProductsPage = async () => {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <p className="text-sm text-slate-500">Manage your product catalog, pricing, and availability.</p>
      </div>
      <ProductsClient initialProducts={products} initialCategories={categories} />
    </div>
  );
};

export default ProductsPage;
