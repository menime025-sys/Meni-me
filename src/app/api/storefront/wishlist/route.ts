import { getCurrentUser } from '@/lib/auth-helpers';
import { getUserWishlist } from '@/server/storefront-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishlist = await getUserWishlist(user.id);
    if (!wishlist) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    return NextResponse.json(wishlist, { status: 200 });
  } catch (error) {
    console.error('[storefront] Failed to fetch wishlist:', error);
    return NextResponse.json(
      { error: 'Unable to fetch wishlist' },
      { status: 500 }
    );
  }
}
