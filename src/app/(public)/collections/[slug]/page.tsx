import { notFound } from "next/navigation";
import { CollectionPageClient } from "./collection-page-client";
import { getCollectionWithProductsBySlug, type StorefrontProduct } from "@/lib/storefront/catalog";
import type { CollectionGridProduct } from "@/components/collections/product-grid";

const pickProductImage = (product: StorefrontProduct): string | null => {
  const primaryAsset = product.media[0]?.url;
  if (primaryAsset) {
    return primaryAsset;
  }

  const collectionImage = product.collections.find((collection) => collection.image?.url)?.image?.url;
  return collectionImage ?? null;
};

const formatDiscount = (price: number, compareAtPrice: number | null) => {
  if (!compareAtPrice || compareAtPrice <= price) {
    return null;
  }

  const discountPercentage = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  return `${discountPercentage}% OFF`;
};

const mapProductsToGrid = (products: StorefrontProduct[], fallbackCategory: string): CollectionGridProduct[] => {
  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    title: product.name,
    originalPrice: product.compareAtPrice ?? product.price,
    salePrice: product.price,
    discount: formatDiscount(product.price, product.compareAtPrice),
    image: pickProductImage(product),
    colors: [],
    category: product.collections[0]?.name ?? fallbackCategory,
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
  }));
};

export default async function CollectionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCollectionWithProductsBySlug(slug);

  if (!data) {
    notFound();
  }

  const products = mapProductsToGrid(data.products, data.collection.name);

  return (
    <CollectionPageClient
      collection={data.collection}
      childrenCollections={data.children}
      products={products}
    />
  );
}
