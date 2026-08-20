// app/(dashboard)/damage/[damageId]/images/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  DamageDetail,
  getDamageById,
  addDamageImages,
  deleteDamageImage,
  getErrorMessage,
} from "@/service/damageService";
import DamageImageGrid from "../../../_components/DamageImageGrid";

const MAX_IMAGE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function DamageImagesPage() {
  const params = useParams<{ damageId: string }>();
  const damageId = params.damageId;

  const [damage, setDamage] = useState<DamageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDamageById(damageId);
      setDamage(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load this damage record."));
    } finally {
      setLoading(false);
    }
  }, [damageId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const files = Array.from(e.target.files ?? []);
    const valid: File[] = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" is not a supported image type (jpeg, png, webp only).`);
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds the ${MAX_IMAGE_MB}MB limit.`);
        continue;
      }
      valid.push(file);
    }
    setPendingFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (pendingFiles.length === 0) return;
    try {
      setUploading(true);
      setFileError(null);
      const updated = await addDamageImages(damageId, pendingFiles);
      setDamage(updated);
      setPendingFiles([]);
    } catch (err) {
      setFileError(getErrorMessage(err, "Couldn't upload photos."));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    try {
      setBusyImageId(imageId);
      setActionError(null);
      await deleteDamageImage(damageId, imageId);
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't delete photo."));
    } finally {
      setBusyImageId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-border" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  if (error || !damage) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/damage" className="text-xs font-medium text-info hover:underline">
          ← Back to damage records
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error ?? "Damage record not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/damage/${damageId}`} className="text-xs font-medium text-info hover:underline">
          ← Back to damage record
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">Manage Photos</h1>
        <p className="mt-1 text-sm text-subtle">{damage.vehicleLabel}</p>
      </div>

      {actionError && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{actionError}</div>
      )}

      {/* Existing images */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text">
          Current Photos {damage.images.length > 0 && `(${damage.images.length})`}
        </h3>

        <DamageImageGrid
          images={damage.images}
          onRequestDelete={(imageId) => setConfirmDeleteId(imageId)}
          onConfirmDelete={handleDelete}
          onCancelDelete={() => setConfirmDeleteId(null)}
          confirmDeleteId={confirmDeleteId}
          busyImageId={busyImageId}
        />
      </div>

      {/* Upload new */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text">Upload New Photos</h3>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-body file:px-3 file:py-2 file:text-xs file:font-medium file:text-text hover:file:bg-border"
        />
        <p className="mt-1 text-xs text-subtle">JPEG, PNG or WEBP, up to {MAX_IMAGE_MB}MB each.</p>

        {fileError && <p className="mt-1 text-xs text-danger">{fileError}</p>}

        {pendingFiles.length > 0 && (
          <>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {pendingFiles.map((file, i) => (
                <div key={`${file.name}-${i}`} className="group relative overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt={file.name} className="h-20 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePendingFile(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : `Upload ${pendingFiles.length} Photo${pendingFiles.length > 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
