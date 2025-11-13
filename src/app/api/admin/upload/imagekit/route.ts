import { NextResponse } from "next/server";
import {
  deleteImageKitFile,
  getImageKitConfig,
  getUploadAuth,
  isImageKitConfigured,
  normalizeImageKitFolder,
} from "@/lib/imagekit";

const buildAuthResponse = (folder?: string) => {
  const auth = getUploadAuth();
  const config = getImageKitConfig();
  const normalizedFolder = normalizeImageKitFolder(folder ?? config.uploadFolder);

  return {
    signature: auth.signature,
    expire: auth.expire,
    token: auth.token,
    publicKey: config.publicKey,
    urlEndpoint: config.urlEndpoint,
    folder: normalizedFolder,
  } as const;
};

export async function GET(request: Request) {
  try {
    if (!isImageKitConfigured()) {
      return NextResponse.json({ message: "ImageKit is not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const folder = normalizeImageKitFolder(searchParams.get("folder"));

    return NextResponse.json(buildAuthResponse(folder));
  } catch (error) {
    console.error("[IMAGEKIT_AUTH]", error);
    return NextResponse.json({ message: "Failed to create ImageKit signature" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isImageKitConfigured()) {
      return NextResponse.json({ message: "ImageKit is not configured" }, { status: 500 });
    }

  const body = await request.json().catch(() => ({}));
  const { folder } = (body ?? {}) as { folder?: string };

  return NextResponse.json(buildAuthResponse(normalizeImageKitFolder(folder)));
  } catch (error) {
    console.error("[IMAGEKIT_AUTH]", error);
    return NextResponse.json({ message: "Failed to create ImageKit signature" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isImageKitConfigured()) {
      return NextResponse.json({ message: "ImageKit is not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { fileId } = body as { fileId?: string };

    if (!fileId) {
      return NextResponse.json({ message: "fileId is required" }, { status: 400 });
    }

    await deleteImageKitFile(fileId);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[IMAGEKIT_DELETE]", error);
    return NextResponse.json({ message: "Failed to delete ImageKit asset" }, { status: 500 });
  }
}
