import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteImageKitFile, isImageKitConfigured } from "@/lib/imagekit";
import { getUserFromRequest } from "@/lib/auth-helpers";
import {
  accountUpdateSchema,
  type AccountUpdateInput,
} from "@/lib/validators/profile";
import {
  formatProfile,
  getProfileByUserId,
  profileAddressSelect,
} from "@/server/profile-service";

const parseAccountUpdateBody = async (request: Request) => {
  const raw = (await request.json().catch(() => ({}))) as
    | AccountUpdateInput
    | (AccountUpdateInput & Record<string, unknown>)
    | undefined;

  if (raw && typeof raw === "object" && "phoneNumber" in raw) {
    const phone = raw.phoneNumber;

    if (typeof phone === "string" && phone.trim().length === 0) {
      raw.phoneNumber = null;
    }
  }

  return accountUpdateSchema.safeParse(raw);
};

const sanitizePhoneNumber = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileByUserId(user.id);

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

  return NextResponse.json(profile);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return NextResponse.json({ message: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseAccountUpdateBody(request);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        avatarFileId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {
      name: payload.name,
      phoneNumber: sanitizePhoneNumber(payload.phoneNumber),
    };

    if (Object.prototype.hasOwnProperty.call(payload, "avatar")) {
      const currentFileId = existing.avatarFileId;

      if (payload.avatar === null) {
        if (currentFileId && isImageKitConfigured()) {
          await deleteImageKitFile(currentFileId).catch((deleteError) => {
            console.error("[PROFILE_AVATAR_DELETE]", deleteError);
          });
        }

        data.image = null;
        data.avatarFileId = null;
      } else if (payload.avatar) {
        if (
          currentFileId &&
          currentFileId !== payload.avatar.fileId &&
          isImageKitConfigured()
        ) {
          await deleteImageKitFile(currentFileId).catch((deleteError) => {
            console.error("[PROFILE_AVATAR_DELETE]", deleteError);
          });
        }

        data.image = payload.avatar.url;
        data.avatarFileId = payload.avatar.fileId;
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        image: true,
        avatarFileId: true,
        defaultAddressId: true,
        addresses: {
          orderBy: { createdAt: "desc" },
          select: profileAddressSelect,
        },
      },
    });

    return NextResponse.json(formatProfile(updated));
  } catch (error) {
    console.error("[PROFILE_PUT]", error);
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
  }
}
