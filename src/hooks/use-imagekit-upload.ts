"use client";

import { useCallback, useState } from "react";

export type UploadedImage = {
  url: string;
  fileId: string;
  name?: string;
  size?: number;
  thumbnailUrl?: string | null;
};

type UseImageKitUploadOptions = {
  folder?: string;
};

type UploadResult = {
  results: UploadedImage[];
  failed: File[];
};

const AUTH_ENDPOINT = "/api/admin/upload/imagekit";
const UPLOAD_ENDPOINT = "https://upload.imagekit.io/api/v1/files/upload";

export const useImageKitUpload = ({ folder }: UseImageKitUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuth = useCallback(async () => {
    const url = folder ? `${AUTH_ENDPOINT}?folder=${encodeURIComponent(folder)}` : AUTH_ENDPOINT;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: "Failed to fetch ImageKit signature" }));
      throw new Error(body.message ?? "Failed to fetch ImageKit signature");
    }

    return response.json() as Promise<{
      signature: string;
      expire: number | string;
      token: string;
      publicKey: string;
      urlEndpoint: string;
      folder?: string;
    }>;
  }, [folder]);

  const uploadFiles = useCallback(
    async (input: FileList | File[]): Promise<UploadResult> => {
      const files = Array.isArray(input) ? input : Array.from(input);

      if (files.length === 0) {
        return { results: [], failed: [] };
      }

      setIsUploading(true);
      setError(null);

      try {
        const uploaded: UploadedImage[] = [];
        const failed: File[] = [];
        let lastErrorMessage: string | null = null;

        for (const file of files) {
          const auth = await getAuth();
          const authFolderRaw = auth.folder ?? folder;
          const authFolder = authFolderRaw
            ? authFolderRaw.startsWith("/")
              ? authFolderRaw
              : `/${authFolderRaw}`
            : undefined;
          const formData = new FormData();
          formData.append("file", file);
          formData.append("fileName", file.name);
          formData.append("useUniqueFileName", "true");
          formData.append("publicKey", auth.publicKey);
          formData.append("signature", auth.signature);
          formData.append("expire", `${auth.expire}`);
          formData.append("token", auth.token);

          if (authFolder) {
            formData.append("folder", authFolder);
          }

          const response = await fetch(UPLOAD_ENDPOINT, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            console.error("[IMAGEKIT_UPLOAD_FAILED]", errorBody ?? response.statusText);
            if (typeof errorBody === "string") {
              lastErrorMessage = errorBody;
            } else if (errorBody?.message && typeof errorBody.message === "string") {
              lastErrorMessage = errorBody.message;
            }
            failed.push(file);
            continue;
          }

          const data = await response.json();
          uploaded.push({
            url: data.url ?? data.filePath,
            fileId: data.fileId,
            name: data.name ?? file.name,
            size: typeof data.size === "number" ? data.size : file.size,
            thumbnailUrl: data.thumbnailUrl ?? null,
          });
        }

        if (failed.length > 0) {
          setError(lastErrorMessage ?? "Some files failed to upload. Please try again.");
        }

        return { results: uploaded, failed };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload to ImageKit";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [folder, getAuth],
  );

  const deleteFile = useCallback(async (fileId: string) => {
    if (!fileId) return;

    const response = await fetch(AUTH_ENDPOINT, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      console.error("[IMAGEKIT_DELETE_FAILED]", errorBody ?? response.statusText);
    }
  }, []);

  const resetError = useCallback(() => setError(null), []);

  return {
    uploadFiles,
    deleteFile,
    isUploading,
    error,
    resetError,
  };
};

export type ImageKitUploader = ReturnType<typeof useImageKitUpload>;
