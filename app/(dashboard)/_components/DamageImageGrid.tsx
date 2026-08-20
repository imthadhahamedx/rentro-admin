// app/(dashboard)/_components/DamageImageGrid.tsx
// Reusable grid of damage photos. Used read-only on the damage detail page
// and in an interactive (delete-enabled) mode on the manage-images page.

import { DamageImage } from "@/service/damageService";

interface DamageImageGridProps {
  images: DamageImage[];
  emptyLabel?: string;
  /** Omit to render a plain, read-only grid (e.g. on the detail page). */
  onRequestDelete?: (imageId: string) => void;
  onConfirmDelete?: (imageId: string) => void;
  onCancelDelete?: () => void;
  confirmDeleteId?: string | null;
  busyImageId?: string | null;
}

export default function DamageImageGrid({
  images,
  emptyLabel = "No images uploaded yet.",
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  confirmDeleteId,
  busyImageId,
}: DamageImageGridProps) {
  const editable = Boolean(onRequestDelete && onConfirmDelete && onCancelDelete);

  if (images.length === 0) {
    return <p className="text-sm text-subtle">{emptyLabel}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {images.map((img) => (
        <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.fileName} className="h-28 w-full object-cover" />

          {editable && (
            <>
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-black/60 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onRequestDelete?.(img.id)}
                  disabled={busyImageId === img.id}
                  className="flex-1 rounded bg-danger/90 px-1.5 py-1 text-[10px] font-medium text-white hover:bg-danger disabled:opacity-50"
                >
                  Delete
                </button>
              </div>

              {confirmDeleteId === img.id && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-2 text-center">
                  <p className="text-[11px] font-medium text-white">Delete this image?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onConfirmDelete?.(img.id)}
                      disabled={busyImageId === img.id}
                      className="rounded bg-danger px-2 py-1 text-[10px] font-medium text-white hover:opacity-90"
                    >
                      {busyImageId === img.id ? "Deleting..." : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancelDelete?.()}
                      className="rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-text hover:bg-white"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
