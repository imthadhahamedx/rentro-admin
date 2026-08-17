// app/(dashboard)/vehicles/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  VehicleCategory,
  Transmission,
  FuelType,
  getAllVehicleCategoryOptions,
  createVehicle,
  getErrorMessage,
} from "@/service/vehicleService";

const TRANSMISSIONS: Transmission[] = ["MANUAL", "AUTOMATIC", "TIPTRONIC"];
const FUEL_TYPES: FuelType[] = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC"];
const MAX_IMAGE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function NewVehiclePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [modelYear, setModelYear] = useState(String(new Date().getFullYear()));
  const [regNo, setRegNo] = useState("");
  const [colour, setColour] = useState("");
  const [transmission, setTransmission] = useState<Transmission>("MANUAL");
  const [fuelType, setFuelType] = useState<FuelType>("PETROL");
  const [seatCount, setSeatCount] = useState("5");
  const [doorCount, setDoorCount] = useState("4");
  const [dailyRate, setDailyRate] = useState("");
  const [currentMileageKm, setCurrentMileageKm] = useState("0");
  const [categoryId, setCategoryId] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingOptions(true);
        setOptionsError(null);
        const cats = await getAllVehicleCategoryOptions();
        if (!cancelled) setCategories(cats);
      } catch (err) {
        if (!cancelled) setOptionsError(getErrorMessage(err, "Couldn't load categories. Please refresh."));
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setImages((prev) => [...prev, ...valid]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
      const vehicle = await createVehicle(
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
          currentMileageKm: currentMileageKm ? Number(currentMileageKm) : undefined,
          categoryId,
        },
        images
      );
      router.push(`/vehicles/${vehicle.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't create the vehicle. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none disabled:opacity-60";
  const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/vehicles" className="text-xs font-medium text-info hover:underline">
          ← Back to vehicles
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">New Vehicle</h1>
        <p className="mt-1 text-sm text-subtle">Add a vehicle to the fleet.</p>
      </div>

      {optionsError && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {optionsError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        {/* Make / Model / Year */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Make *</label>
            <input value={make} onChange={(e) => setMake(e.target.value)} className={inputClass} placeholder="Toyota" required />
          </div>
          <div>
            <label className={labelClass}>Model *</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} placeholder="Corolla" required />
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
            <input value={regNo} onChange={(e) => setRegNo(e.target.value)} className={inputClass} placeholder="CAB-1234" required />
          </div>
          <div>
            <label className={labelClass}>Colour</label>
            <input value={colour} onChange={(e) => setColour(e.target.value)} className={inputClass} placeholder="White" />
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingOptions}
              className={inputClass}
              required
            >
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
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value as Transmission)}
              className={inputClass}
              required
            >
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
            <input
              type="number"
              min={1}
              value={seatCount}
              onChange={(e) => setSeatCount(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Doors *</label>
            <input
              type="number"
              min={1}
              value={doorCount}
              onChange={(e) => setDoorCount(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Rate / Mileage */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Daily Rate (Rs.) *</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className={inputClass}
              placeholder="8500"
              required
            />
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

        {/* Images */}
        <div>
          <label className={labelClass}>Images</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageSelect}
            className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-body file:px-3 file:py-2 file:text-xs file:font-medium file:text-text hover:file:bg-border"
          />
          <p className="mt-1 text-xs text-subtle">JPEG, PNG or WEBP, up to {MAX_IMAGE_MB}MB each. The first image becomes the primary photo.</p>

          {imageError && <p className="mt-1 text-xs text-danger">{imageError}</p>}

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((file, i) => (
                <div key={`${file.name}-${i}`} className="group relative overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt={file.name} className="h-20 w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
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
          <Link href="/vehicles" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || loadingOptions}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Vehicle"}
          </button>
        </div>
      </form>
    </div>
  );
}
