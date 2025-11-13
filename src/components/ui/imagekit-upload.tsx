"use client";

import {
  useRef,
  useState,
  useMemo,
  useCallback,
  type DragEvent as ReactDragEvent,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useImageKitUpload, type UploadedImage } from "@/hooks/use-imagekit-upload";
import { Loader2, Trash2, UploadCloud } from "lucide-react";

export type ImageKitUploadValue = UploadedImage;

type ImageKitUploadProps = {
  value: ImageKitUploadValue[];
  onChange: (value: ImageKitUploadValue[]) => void;
  className?: string;
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  emptyHint?: string;
  priorityFirst?: boolean;
};

const ImageKitUpload = ({
  value,
  onChange,
  className,
  folder,
  multiple = true,
  maxFiles,
  emptyHint = "Drop files or click to upload",
  priorityFirst = false,
}: ImageKitUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localWarning, setLocalWarning] = useState<string | null>(null);
  const { uploadFiles, deleteFile, isUploading, error, resetError } = useImageKitUpload({ folder });

  const images = useMemo(() => value ?? [], [value]);
  const remainingSlots = useMemo(() => {
    if (typeof maxFiles !== "number") return undefined;
    return Math.max(maxFiles - images.length, 0);
  }, [images.length, maxFiles]);
  const disabled = useMemo(() => {
    if (isUploading) return true;
    if (!multiple && images.length > 0) return true;
    return remainingSlots === 0;
  }, [images.length, isUploading, multiple, remainingSlots]);

  const handleUpload = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || ("length" in files && files.length === 0)) return;

      const availableCount = typeof remainingSlots === "number" ? remainingSlots : undefined;
      const selectedFiles = Array.from(files).slice(0, availableCount ?? undefined);

      if (selectedFiles.length === 0) {
        setLocalWarning("Upload limit reached. Remove an image to add another.");
        return;
      }

      resetError();
      setLocalWarning(null);

      try {
        const { results } = await uploadFiles(selectedFiles);

        if (results.length === 0) {
          return;
        }

        if (multiple) {
          onChange([...images, ...results]);
        } else {
          onChange(results.slice(-1));
        }
      } catch (uploadError) {
        console.error("[IMAGEKIT_UPLOAD]", uploadError);
      } finally {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [images, multiple, onChange, remainingSlots, resetError, uploadFiles],
  );

  const handleRemove = useCallback(
    async (fileId: string) => {
      try {
        await deleteFile(fileId);
      } catch (deleteError) {
        console.error("[IMAGEKIT_DELETE]", deleteError);
      } finally {
        onChange(images.filter((image) => image.fileId !== fileId));
      }
    },
    [deleteFile, images, onChange],
  );

  const handleDrag = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (event: ReactDragEvent<HTMLDivElement>) => {
      handleDrag(event);
      await handleUpload(event.dataTransfer?.files ?? null);
    },
    [handleDrag, handleUpload],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "relative flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center transition hover:border-slate-400 hover:bg-slate-50",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onClick={() => {
          if (disabled) return;
          inputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled) {
              inputRef.current?.click();
            }
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple && (typeof maxFiles !== "number" || maxFiles > 1)}
          className="hidden"
          onChange={(event) => handleUpload(event.target.files)}
        />
        <div className="flex flex-col items-center gap-2 text-slate-500">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
          <div className="text-sm font-medium text-slate-700">
            {disabled ? "Upload limit reached" : "Click or drag files to upload"}
          </div>
          <p className="text-xs text-slate-500">
            {disabled ? "Remove an image to upload a new one." : emptyHint}
          </p>
          {typeof remainingSlots === "number" ? (
            <p className="text-xs text-slate-400">{remainingSlots} slots remaining</p>
          ) : null}
        </div>
      </div>

      {(error || localWarning) && (
        <p className="text-sm font-medium text-rose-600">{error ?? localWarning}</p>
      )}

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const shouldPrioritize = priorityFirst && index === 0;

            return (
              <div key={image.fileId} className="group relative overflow-hidden rounded-xl border border-slate-200">
              <Image
                src={image.url}
                alt={image.name ?? "Uploaded image"}
                width={240}
                height={240}
                className="h-32 w-full object-cover"
                priority={shouldPrioritize}
                loading={shouldPrioritize ? "eager" : "lazy"}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-900/70 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                <span className="truncate">{image.name ?? "Image"}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:bg-white/10"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove(image.fileId);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default ImageKitUpload;
