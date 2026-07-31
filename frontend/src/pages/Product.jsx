import { AlertTriangle, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductForm from "../components/ProductForm";
import useAuth from "../context/useAuth";
import useBusinessMode from "../context/useBusinessMode";
import {
  deleteSellerProduct,
  getSellerProductsForStore,
  normalizeCatalogType,
  syncMarketplaceProducts,
  upsertSellerProduct,
} from "../lib/marketplaceStore";
import { getProductFallbackImage } from "../lib/productMedia";

const formatCurrency = (value) =>
  `GHS ${Number(value || 0).toLocaleString("en-GH")}`;

function Product() {
  const { user } = useAuth();
  const { mode } = useBusinessMode();
  const sellerId = user?.id || "";
  const sellerName = user?.storeName || user?.name || "Seller Store";
  const [products, setProducts] = useState(() => getSellerProductsForStore(sellerId));
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [savingProduct, setSavingProduct] = useState(false);

  const refreshProducts = () => {
    setProducts(getSellerProductsForStore(sellerId));
  };

  useEffect(() => {
    const loadProducts = async () => {
      await syncMarketplaceProducts();
      setProducts(getSellerProductsForStore(sellerId));
    };

    if (sellerId) {
      void loadProducts();
    }
  }, [sellerId]);

  const handleDelete = async (id) => {
    await deleteSellerProduct(id);
    refreshProducts();
  };

  const handleSaveProduct = async (formData) => {
    setSavingProduct(true);

    try {
      const savedProduct = await upsertSellerProduct({
        ...editProduct,
        ...formData,
        sellerId,
        sellerName,
        createdAt: editProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setProducts((currentProducts) => {
        const existingIndex = currentProducts.findIndex(
          (product) => product.id === savedProduct.id,
        );

        if (existingIndex === -1) {
          return [savedProduct, ...currentProducts];
        }

        return currentProducts.map((product) =>
          product.id === savedProduct.id ? savedProduct : product,
        );
      });

      await syncMarketplaceProducts();
      refreshProducts();
      setEditProduct(null);
      setShowForm(false);
    } catch (error) {
      alert(error.message || "Unable to update the product right now.");
    } finally {
      setSavingProduct(false);
    }
  };

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const catalogType = normalizeCatalogType(product.catalogType);
        const matchesMode = catalogType === "all" || catalogType === mode;
        const matchesSearch = [product.name, product.description, product.category]
          .filter(Boolean)
          .some((value) =>
            value.toLowerCase().includes(searchTerm.trim().toLowerCase()),
          );
        const inventory = Number(product.inventory || 0);
        const matchesStock =
          stockFilter === "all"
            ? true
            : stockFilter === "low"
              ? inventory <= 15
              : inventory > 15;

        return matchesMode && matchesStock && (searchTerm ? matchesSearch : true);
      }),
    [mode, products, searchTerm, stockFilter],
  );

  const productsInBothCatalogs = products.filter(
    (product) => normalizeCatalogType(product.catalogType) === "all",
  ).length;
  const totalInventory = filteredProducts.reduce(
    (sum, product) => sum + Number(product.inventory || 0),
    0,
  );
  const lowStockProducts = filteredProducts.filter(
    (product) => Number(product.inventory || 0) <= 15,
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Seller Catalog
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Products for {mode} storefront
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Products published here automatically flow into the retail or
              wholesale storefront based on the catalog type you choose.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search products by name, category, or description"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:shrink-0">
                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
                  {[
                    { value: "all", label: "All Stock" },
                    { value: "low", label: "Low Stock" },
                    { value: "healthy", label: "Healthy" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStockFilter(option.value)}
                      className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                        stockFilter === option.value
                          ? "bg-slate-950 text-white"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setEditProduct(null);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Visible now</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {filteredProducts.length} products
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Shared across both catalogs</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {productsInBothCatalogs}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Tracked inventory</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {totalInventory.toLocaleString("en-IN")} units
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 md:col-span-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-700">
                <AlertTriangle size={18} />
              </span>
              <div>
                <p className="text-sm text-amber-700">Low stock attention</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {lowStockProducts} products in this filtered view have 15 units
                  or less remaining.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {filteredProducts.length === 0 ? (
        <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h3 className="text-2xl font-bold text-slate-950">
            No seller products in this catalog yet.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Add your first product and it will become available to buyers in the
            matching retail or wholesale section immediately.
          </p>
          <button
            onClick={() => {
              setEditProduct(null);
              setShowForm(true);
            }}
            className="mt-6 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Publish First Product
          </button>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
            >
              <div className="grid gap-0 md:grid-cols-[220px,minmax(0,1fr)]">
                <div className="h-full bg-slate-100">
                  <img
                    src={product.image || getProductFallbackImage(product)}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.src = getProductFallbackImage(product);
                    }}
                    className="h-full min-h-[220px] w-full object-cover"
                  />
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {product.category}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      {normalizeCatalogType(product.catalogType) === "all"
                        ? "Retail and wholesale"
                        : normalizeCatalogType(product.catalogType)}
                    </span>
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                      Sustainability {product.sustainabilityScore}/100
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-bold text-slate-950">
                    {product.name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {product.description || "No description added yet."}
                  </p>

                  {product.features?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.features.slice(0, 4).map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Retail Price
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-950">
                        {formatCurrency(product.retailPrice)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Wholesale Price
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-950">
                        {formatCurrency(product.wholesalePrice)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span>Min wholesale qty: {product.minWholesaleQty || 1}</span>
                    <span>Inventory: {Number(product.inventory || 0)}</span>
                    {(product.gallery || []).filter((url) => !url.includes("/api/media/catalog/")).length > 1 && (
                      <span>{product.gallery.filter((url) => !url.includes("/api/media/catalog/")).length} gallery views</span>
                    )}
                    <span>{product.features?.length || 0} features</span>
                    <span>
                      Sustainability: {product.sustainabilityScore}/100
                    </span>
                    {Number(product.inventory || 0) <= 15 && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                        Low stock
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setEditProduct(product);
                        setShowForm(true);
                      }}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                    >
                      Edit Product
                    </button>

                    <button
                      onClick={() => handleDelete(product.id)}
                      className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                    >
                      Delete Product
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {showForm && (
        <ProductForm
          key={`${editProduct?.id || `new-${mode}`}-${showForm ? "open" : "closed"}`}
          onSaveProduct={handleSaveProduct}
          onClose={() => {
            if (savingProduct) {
              return;
            }
            setShowForm(false);
            setEditProduct(null);
          }}
          editProduct={editProduct}
          defaultCatalogType={mode}
          isSaving={savingProduct}
        />
      )}
    </div>
  );
}

export default Product;
