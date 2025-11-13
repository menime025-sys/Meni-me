export const commerceCountsQueryKey = ["commerce-counts"] as const;

export const productReviewsQueryKey = (productId: string) => [
	"product-reviews",
	productId,
] as const;
