// app/(dashboard)/damage/[damageId]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  VehicleOption,
  DamageDetail,
  DamageBy,
  getAllVehicleOptionsForDamage,
  getDamageById,
  updateDamage,
  getErrorMessage,
} from "@/service/damageService";

const DAMAGE_BY_OPTIONS: DamageBy[] = ["CUSTOMER", "INTERNAL", "OTHER"];
const MAX_IMAGE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function EditDamagePage() {
  const params = useParams<{ damageId: string }>();
  const router = useRouter();
  const damageId = params.damageId;

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [damageBy, setDamageBy] = useState<DamageBy>("CUSTOMER");
  const [remark, setRemark] = useState("");

  const [newImages, setNewImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setLoadError(null);
        const [damage, opts]: [DamageDetail, VehicleOption[]] = await Promise.all([
          getDamageById(damageId),
          getAllVehicleOptionsForDamage(),
        ]);
        if (cancelled) return;
        setVehicles(opts);
        setVehicleId(damage.vehicleId);
        setDescription(damage.description);
        setDamageBy(damage.damageBy);
        setRemark(damage.remark ?? "");
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, "Couldn't load this damage record."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [damageId]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null);
    const files = Array.from(e.target.files ?? []);
    const valid: File[] = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setImageError(`"${file.name}" is not a supported image type (jpeg, png, webp only).`);
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setImageError(`"${file.name}" exceeds the ${MAX_IMAGE_MB}MB limit.`);
        continue;
      }
      valid.push(file);
    }
    setNewImages((prev) => [...prev, ...valid]);
    e.target.value = "";
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!vehicleId || !description.trim()) {
      setError("Please select a vehicle and describe the damage.");
      return;
    }

    try {
      setSubmitting(true);
      await updateDamage(
        damageId,
        {
          vehicleId,
          description: description.trim(),
          damageBy,
          remark: remark.trim() || undefined,
        },
        newImages
      );
      router.push(`/damage/${damageId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update the damage record. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none disabled:opacity-60";
  const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-border" />
        <div className="h-96 w-full animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/damage" className="text-xs font-medium text-info hover:underline">
          ← Back to damage records
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/damage/${damageId}`} className="text-xs font-medium text-info hover:underline">
          ← Back to damage record
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">Edit Damage Record</h1>
        <p className="mt-1 text-sm text-subtle">Update the details of this damage report.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        {/* Vehicle / Damage By */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Vehicle *</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputClass} required>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.modelYear}) · {v.regNo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Damage Reported By *</label>
            <select
              value={damageBy}
              onChange={(e) => setDamageBy(e.target.value as DamageBy)}
              className={inputClass}
              required
            >
              {DAMAGE_BY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputClass}
            required
          />
        </div>

        {/* Remark */}
        <div>
          <label className={labelClass}>Internal Remark</label>
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} className={inputClass} />
        </div>

        {/* New Images */}
        <div>
          <label className={labelClass}>Add More Photos</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageSelect}
            className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-body file:px-3 file:py-2 file:text-xs file:font-medium file:text-text hover:file:bg-border"
          />
          <p className="mt-1 text-xs text-subtle">
            JPEG, PNG or WEBP, up to {MAX_IMAGE_MB}MB each. To remove existing photos, use{" "}
            <Link href={`/damage/${damageId}/images`} className="text-info hover:underline">
              Manage Photos
            </Link>
            .
          </p>

          {imageError && <p className="mt-1 text-xs text-danger">{imageError}</p>}

          {newImages.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {newImages.map((file, i) => (
                <div key={`${file.name}-${i}`} className="group relative overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt={file.name} className="h-20 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href={`/damage/${damageId}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
