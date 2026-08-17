// app/(dashboard)/vehicles/[vehicleId]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  VehicleCategory,
  VehicleDetail,
  Transmission,
  FuelType,
  VehicleStatus,
  getAllVehicleCategoryOptions,
  getVehicleById,
  updateVehicle,
  getErrorMessage,
} from "@/service/vehicleService";

const TRANSMISSIONS: Transmission[] = ["MANUAL", "AUTOMATIC", "TIPTRONIC"];
const FUEL_TYPES: FuelType[] = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC"];
const STATUS_OPTIONS: VehicleStatus[] = ["AVAILABLE", "RENTED", "MAINTENANCE", "INACTIVE"];
const MAX_IMAGE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function EditVehiclePage() {
  const params = useParams<{ vehicleId: string }>();
  const router = useRouter();
  const vehicleId = params.vehicleId;

  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [regNo, setRegNo] = useState("");
  const [colour, setColour] = useState("");
  const [transmission, setTransmission] = useState<Transmission>("MANUAL");
  const [fuelType, setFuelType] = useState<FuelType>("PETROL");
  const [seatCount, setSeatCount] = useState("5");
  const [doorCount, setDoorCount] = useState("4");
  const [dailyRate, setDailyRate] = useState("");
  const [status, setStatus] = useState<VehicleStatus>("AVAILABLE");
  const [currentMileageKm, setCurrentMileageKm] = useState("0");
  const [categoryId, setCategoryId] = useState("");

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
        const [vehicle, cats]: [VehicleDetail, VehicleCategory[]] = await Promise.all([
          getVehicleById(vehicleId),
          getAllVehicleCategoryOptions(),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setMake(vehicle.make);
        setModel(vehicle.model);
        setModelYear(String(vehicle.modelYear));
        setRegNo(vehicle.regNo);
        setColour(vehicle.colour ?? "");
        setTransmission(vehicle.transmission);
        setFuelType(vehicle.fuelType);
        setSeatCount(String(vehicle.seatCount));
        setDoorCount(String(vehicle.doorCount));
        setDailyRate(String(vehicle.dailyRate));
        setStatus(vehicle.status);
        setCurrentMileageKm(vehicle.currentMileageKm != null ? String(vehicle.currentMileageKm) : "0");
        setCategoryId(vehicle.categoryId);
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, "Couldn't load this vehicle."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

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

    if (!make.trim() || !model.trim() || !regNo.trim() || !categoryId || !dailyRate) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      await updateVehicle(
        vehicleId,
        {
          make: make.trim(),
          model: model.trim(),
          modelYear: Number(modelYear),
          regNo: regNo.trim(),
          colour: colour.trim() || undefined,
          transmission,
          fuelType,
          seatCount: Number(seatCount),
          doorCount: Number(doorCount),
          dailyRate: Number(dailyRate),
          status,
          currentMileageKm: currentMileageKm ? Number(currentMileageKm) : undefined,
          categoryId,
        },
        newImages
      );
      router.push(`/vehicles/${vehicleId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update the vehicle. Please try again."));
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
        <Link href="/vehicles" className="text-xs font-medium text-info hover:underline">
          ← Back to vehicles
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/vehicles/${vehicleId}`} className="text-xs font-medium text-info hover:underline">
          ← Back to vehicle
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">Edit Vehicle</h1>
        <p className="mt-1 text-sm text-subtle">Update details for {make} {model}.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        {/* Make / Model / Year */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Make *</label>
            <input value={make} onChange={(e) => setMake(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Model *</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Model Year *</label>
            <input
              type="number"
              min={1980}
              max={2100}
              value={modelYear}
              onChange={(e) => setModelYear(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Reg No / Colour / Category */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Registration No *</label>
            <input value={regNo} onChange={(e) => setRegNo(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Colour</label>
            <input value={colour} onChange={(e) => setColour(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass} required>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transmission / Fuel / Seats / Doors */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Transmission *</label>
            <select value={transmission} onChange={(e) => setTransmission(e.target.value as Transmission)} className={inputClass} required>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fuel Type *</label>
            <select value={fuelType} onChange={(e) => setFuelType(e.target.value as FuelType)} className={inputClass} required>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Seats *</label>
            <input type="number" min={1} value={seatCount} onChange={(e) => setSeatCount(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Doors *</label>
            <input type="number" min={1} value={doorCount} onChange={(e) => setDoorCount(e.target.value)} className={inputClass} required />
          </div>
        </div>

        {/* Rate / Status / Mileage */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Daily Rate (Rs.) *</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as VehicleStatus)} className={inputClass}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Current Mileage (km)</label>
            <input
              type="number"
              min={0}
              value={currentMileageKm}
              onChange={(e) => setCurrentMileageKm(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Add more images */}
        <div>
          <label className={labelClass}>Add More Images</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageSelect}
            className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-body file:px-3 file:py-2 file:text-xs file:font-medium file:text-text hover:file:bg-border"
          />
          <p className="mt-1 text-xs text-subtle">
            JPEG, PNG or WEBP, up to {MAX_IMAGE_MB}MB each. To remove or reorder existing images, use{" "}
            <Link href={`/vehicles/${vehicleId}/images`} className="text-info hover:underline">
              Manage Images
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
            href={`/vehicles/${vehicleId}`}
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
