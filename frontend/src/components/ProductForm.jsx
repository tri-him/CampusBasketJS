import { useMemo, useState } from "react";
import {
  getEditableProductMediaUrl,
  getProductFallbackImage,
  isGeneratedCatalogMediaUrl,
  resolveProductMediaUrl,
} from "../lib/productMedia";

const categoryOptions = [
  "Eco Essentials",
  "Home and Kitchen",
  "Personal Care",
  "Office and Stationery",
  "Packaging Supplies",
  "Fashion and Accessories",
  "Food and Grocery",
];

const createInitialFormData = (catalogType = "retail") => ({
  name: "",
  description: "",
  category: "Eco Essentials",
  featuresText: "",
  catalogType,
  sustainabilityScore: "80",
  retailPrice: "",
  wholesalePrice: "",
  minWholesaleQty: "10",
  inventory: "",
  image: "",
  galleryText: "",
});

const parseLineSeparatedValues = (value) =>
  Array.from(
    new Set(
      String(value || "")
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );

const toLineSeparatedValues = (values) =>
  Array.isArray(values) ? values.join("\n") : "";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };

    reader.onerror = () => {
      reject(new Error("Unable to read file."));
    };

    reader.readAsDataURL(file);
  });

const resolvePreviewImage = (value, fallbackProduct) =>
  resolveProductMediaUrl(value) || getProductFallbackImage(fallbackProduct);

const createEditFormData = (editProduct) => ({
  ...editProduct,
  featuresText: toLineSeparatedValues(editProduct.features),
  sustainabilityScore: String(editProduct.sustainabilityScore || 80),
  retailPrice: String(editProduct.retailPrice || ""),
  wholesalePrice: String(editProduct.wholesalePrice || ""),
  minWholesaleQty: String(editProduct.minWholesaleQty || 1),
  inventory: String(editProduct.inventory || ""),
  image: getEditableProductMediaUrl(editProduct.image || ""),
  galleryText: toLineSeparatedValues(
    (editProduct.gallery || [])
      .filter((galleryUrl) => galleryUrl !== editProduct.image)
      .filter((galleryUrl) => !isGeneratedCatalogMediaUrl(galleryUrl))
      .map((galleryUrl) => getEditableProductMediaUrl(galleryUrl)),
  ),
});

function ProductForm({
  onSaveProduct,
  onClose,
  editProduct,
  defaultCatalogType = "retail",
  isSaving = false,
}) {
  const [formData, setFormData] = useState(
    editProduct ? createEditFormData(editProduct) : createInitialFormData(defaultCatalogType),
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleChange = (e) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    setUploadingImage(true);

    reader.onload = () => {
      setFormData((currentFormData) => ({
        ...currentFormData,
        image: typeof reader.result === "string" ? reader.result : "",
      }));
      setUploadingImage(false);
      e.target.value = "";
    };

    reader.onerror = () => {
      setUploadingImage(false);
      alert("Unable to read the selected image. Please try another file.");
    };

    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    setUploadingGallery(true);

    try {
      const imageUrls = (await Promise.all(files.map(readFileAsDataUrl))).filter(Boolean);

      setFormData((currentFormData) => {
        const nextGallery = Array.from(
          new Set([
            ...parseLineSeparatedValues(currentFormData.galleryText),
            ...imageUrls,
          ]),
        );

        return {
          ...currentFormData,
          galleryText: nextGallery.join("\n"),
        };
      });
    } catch {
      alert("Unable to read one or more gallery images. Please try another file.");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const features = parseLineSeparatedValues(formData.featuresText);
    const gallery = parseLineSeparatedValues(formData.galleryText);

    onSaveProduct({
      ...formData,
      sustainabilityScore: Number(formData.sustainabilityScore) || 80,
      retailPrice: Number(formData.retailPrice) || 0,
      wholesalePrice: Number(formData.wholesalePrice) || 0,
      minWholesaleQty: Number(formData.minWholesaleQty) || 1,
      inventory: Number(formData.inventory) || 0,
      features,
      gallery,
    });
  };

  const previewFallbackProduct = useMemo(
    () => ({
      name: formData.name || "CampusBasket Product",
      category: formData.category || "Premium catalog",
    }),
    [formData.category, formData.name],
  );

  const productFeatures = parseLineSeparatedValues(formData.featuresText);
  const galleryPreview = Array.from(
    new Set([formData.image, ...parseLineSeparatedValues(formData.galleryText)]),
  ).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
        <div className="flex h-full w-full max-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)] sm:max-h-[calc(100vh-32px)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Seller Catalog
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {editProduct ? "Edit Product" : "Add Product"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Keep product details organized in one place with clear pricing,
                key features, and a multi-view gallery.
              </p>
            </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-hidden px-5 py-5 sm:px-7">
              <div className="grid h-full gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
                <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
                  <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Product Basics
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Add the main product information first so the listing feels complete.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Product Name
                        </span>
                        <input
                          type="text"
                          name="name"
                          placeholder="Premium product title"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                          required
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Category
                        </span>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                        >
                          {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Catalog Type
                        </span>
                        <select
                          name="catalogType"
                          value={formData.catalogType}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                        >
                          <option value="retail">Retail only</option>
                          <option value="wholesale">Wholesale only</option>
                          <option value="all">Retail and wholesale</option>
                        </select>
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Description
                        </span>
                        <textarea
                          name="description"
                          placeholder="Describe why buyers should choose this product."
                          value={formData.description}
                          onChange={handleChange}
                          rows={4}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Pricing And Stock
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Keep retail, wholesale, and inventory details neatly grouped.
                      </p>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 xl:col-span-2">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Sustainability Score
                            </p>
                            <p className="mt-1 text-xs leading-6 text-slate-500">
                              Rate the product from 1 to 100 based on materials,
                              packaging, and sustainability practices.
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-4 py-2 text-lg font-black text-emerald-700">
                            {formData.sustainabilityScore}/100
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          name="sustainabilityScore"
                          value={formData.sustainabilityScore}
                          onChange={handleChange}
                          className="mt-4 w-full accent-emerald-500"
                        />
                      </div>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Retail Price
                        </span>
                        <input
                          type="number"
                          min="0"
                          name="retailPrice"
                          placeholder="499"
                          value={formData.retailPrice}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Wholesale Price
                        </span>
                        <input
                          type="number"
                          min="0"
                          name="wholesalePrice"
                          placeholder="320"
                          value={formData.wholesalePrice}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Min Wholesale Qty
                        </span>
                        <input
                          type="number"
                          min="1"
                          name="minWholesaleQty"
                          placeholder="10"
                          value={formData.minWholesaleQty}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Inventory
                        </span>
                        <input
                          type="number"
                          min="0"
                          name="inventory"
                          placeholder="120"
                          value={formData.inventory}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Key Features
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Add one feature per line so it appears cleanly on the product page.
                      </p>
                    </div>

                    <label className="space-y-2">
                      <textarea
                        name="featuresText"
                        placeholder={"Reusable design\nGift-ready packaging\nBulk-friendly for stores"}
                        value={formData.featuresText}
                        onChange={handleChange}
                        rows={5}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                      />
                    </label>

                    {productFeatures.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {productFeatures.slice(0, 6).map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
                  <section className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#182538_100%)] p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                      Live Preview
                    </p>
                    <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white/8">
                      <img
                        src={resolvePreviewImage(formData.image, previewFallbackProduct)}
                        alt="Product preview"
                        onError={(event) => {
                          event.currentTarget.src = getProductFallbackImage(
                            previewFallbackProduct,
                          );
                        }}
                        className="h-56 w-full object-cover"
                      />
                    </div>
                    <div className="mt-4">
                      <p className="text-lg font-bold">
                        {formData.name || "Product title preview"}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {formData.category || "Category"}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {formData.description ||
                          "Your product description will appear here so you can see how the listing feels before publishing."}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Main Product Image
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Pick the primary image that should lead the listing.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                      />
                      <input
                        type="text"
                        name="image"
                        placeholder="Or paste a main image URL"
                        value={formData.image}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                      />
                      <p className="text-xs text-slate-500">
                        {uploadingImage
                          ? "Uploading preview..."
                          : "Use an upload or image URL for the main product photo."}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Product Gallery
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Add extra product views so users can browse multiple angles.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-slate-100"
                      />

                      <textarea
                        name="galleryText"
                        placeholder={"Paste extra image URLs, one per line\nhttps://example.com/product-angle.jpg\nhttps://example.com/product-detail.jpg"}
                        value={formData.galleryText}
                        onChange={handleChange}
                        rows={5}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
                      />

                      <p className="text-xs text-slate-500">
                        {uploadingGallery
                          ? "Uploading gallery images..."
                          : "Gallery images show as extra thumbnails on the product page."}
                      </p>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {galleryPreview.length > 0 ? (
                          galleryPreview.map((galleryImage, index) => (
                            <div
                              key={`${galleryImage.slice(0, 36)}-${index}`}
                              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                            >
                              <img
                                src={resolvePreviewImage(galleryImage, previewFallbackProduct)}
                                alt={`Gallery preview ${index + 1}`}
                                onError={(event) => {
                                  event.currentTarget.src = getProductFallbackImage(
                                    previewFallbackProduct,
                                  );
                                }}
                                className="h-24 w-full object-cover"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                            Add gallery images to preview extra product views here.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {isSaving
                  ? editProduct
                    ? "Updating..."
                    : "Publishing..."
                  : editProduct
                    ? "Update Product"
                    : "Publish Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductForm;
