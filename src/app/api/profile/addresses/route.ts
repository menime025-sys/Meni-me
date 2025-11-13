import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-helpers";
import {
  createAddressSchema,
  type CreateAddressInput,
} from "@/lib/validators/profile";
import {
  formatProfileAddress,
  profileAddressSelect,
  type RawProfile,
} from "@/server/profile-service";

const sanitizeOptional = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const parseBody = async (request: Request) => {
  const json = (await request.json().catch(() => ({}))) as CreateAddressInput | undefined;
  return createAddressSchema.safeParse(json);
};

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        defaultAddressId: true,
        addresses: {
          orderBy: { createdAt: "desc" },
          select: profileAddressSelect,
        },
      },
    });

    if (!record) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const response = record.addresses.map((address: RawProfile["addresses"][number]) =>
      formatProfileAddress(address, record.defaultAddressId),
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PROFILE_ADDRESSES_GET]", error);
    return NextResponse.json({ message: "Failed to load addresses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(request);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        defaultAddressId: true,
      },
    });

    if (!userRecord) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const address = await prisma.userAddress.create({
      data: {
        userId: user.id,
        label: sanitizeOptional(payload.label),
        fullName: payload.fullName.trim(),
        phoneNumber: sanitizeOptional(payload.phoneNumber),
        streetLine1: payload.streetLine1.trim(),
        streetLine2: sanitizeOptional(payload.streetLine2),
        city: payload.city.trim(),
        state: sanitizeOptional(payload.state),
        postalCode: sanitizeOptional(payload.postalCode),
        country: payload.country.trim(),
      },
      select: profileAddressSelect,
    });

    let defaultAddressId = userRecord.defaultAddressId;

    if (payload.setDefault || !defaultAddressId) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          defaultAddressId: address.id,
        },
        select: {
          defaultAddressId: true,
        },
      });

      defaultAddressId = updatedUser.defaultAddressId;
    }

    return NextResponse.json(formatProfileAddress(address, defaultAddressId));
  } catch (error) {
    console.error("[PROFILE_ADDRESSES_POST]", error);
    return NextResponse.json({ message: "Failed to create address" }, { status: 500 });
  }
}
