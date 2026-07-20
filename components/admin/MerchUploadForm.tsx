"use client";

import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

type Props = {
  onCreated: () => void;
};

export default function MerchUploadForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSize(size: string) {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    setPreviews((prev) => [
      ...prev,
      ...selected.map((f) => URL.createObjectURL(f)),
    ]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !price) {
      setError("Name and price are required.");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload every selected image to Supabase Storage first
      const imageUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/merch/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Image upload failed.");
        imageUrls.push(data.url);
      }

      // 2. Create the product row referencing the uploaded image URLs
      const res = await fetch("/api/admin/merch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          stock_quantity: Number(stock) || 0,
          sizes,
          image_urls: imageUrls,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create product.");

      // Reset form
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setSizes([]);
      setFiles([]);
      setPreviews([]);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border border-neon-purple/30 bg-surface p-5"
    >
      <h2 className="font-display font-700 text-lg">Upload New Gear</h2>

      <input
        required
        placeholder="Product name (e.g. Nocturne Hoodie)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border border-border-subtle bg-background px-4 py-3 text-sm outline-none focus:border-neon-purple"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="border border-border-subtle bg-background px-4 py-3 text-sm outline-none focus:border-neon-purple"
      />

      <div className="flex gap-3">
        <input
          required
          type="number"
          min="0"
          placeholder="Price (₦)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-1/2 border border-border-subtle bg-background px-4 py-3 text-sm outline-none focus:border-neon-purple"
        />
        <input
          type="number"
          min="0"
          placeholder="Stock quantity"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-1/2 border border-border-subtle bg-background px-4 py-3 text-sm outline-none focus:border-neon-purple"
        />
      </div>

      <div>
        <span className="font-glitch text-[10px] uppercase tracking-wider text-foreground/50">
          Sizes (optional — skip for non-apparel)
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((size) => (
            <button
              type="button"
              key={size}
              onClick={() => toggleSize(size)}
              className={`border px-3 py-1.5 font-glitch text-xs ${
                sizes.includes(size)
                  ? "border-neon-purple bg-neon-purple text-background"
                  : "border-border-subtle text-foreground/60"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-border-subtle py-4 font-glitch text-xs uppercase tracking-wider text-foreground/60">
          <Upload size={14} /> Add Images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        {previews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative h-16 w-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center bg-danger text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="mt-2 flex items-center justify-center gap-2 bg-neon-purple py-3.5 font-display font-700 text-sm text-background disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Uploading…
          </>
        ) : (
          "Publish Product"
        )}
      </button>
    </form>
  );
}
