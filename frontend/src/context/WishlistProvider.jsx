import { useEffect, useMemo, useState } from "react";
import useCustomerAuth from "./useCustomerAuth";
import WishlistContext from "./WishlistContext";
import { getMarketplaceProducts, normalizeProductRecord } from "../lib/marketplaceStore";
import { userApi } from "../services/api";

const WISHLIST_KEY = "CampusBasket-user-wishlist";

const readWishlistStore = () => {
  try {
    const saved = localStorage.getItem(WISHLIST_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const writeWishlistStore = (value) => {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(value));
};

const getWishlistScope = (customer) =>
  customer?.email?.trim().toLowerCase() || "guest";

function WishlistProvider({ children }) {
  const { customer } = useCustomerAuth();
  const wishlistScope = getWishlistScope(customer);
  const [wishlistStore, setWishlistStore] = useState(() => readWishlistStore());
  const [remoteWishlist, setRemoteWishlist] = useState([]);

  useEffect(() => {
    writeWishlistStore(wishlistStore);
  }, [wishlistStore]);

  useEffect(() => {
    const syncWishlist = async () => {
      if (!customer) {
        setRemoteWishlist([]);
        return;
      }

      try {
        const response = await userApi.listWishlist();
        setRemoteWishlist(
          (response.data || []).map((item) => ({
            productId: item.productId,
            mode: String(item.mode || "").toLowerCase(),
            addedAt: item.createdAt,
            product: normalizeProductRecord(item.product),
          })),
        );
      } catch {
        setRemoteWishlist([]);
      }
    };

    void syncWishlist();
  }, [customer]);

  const localWishlistEntries = useMemo(
    () => wishlistStore[wishlistScope] || [],
    [wishlistStore, wishlistScope],
  );

  const wishlistItems = useMemo(() => {
    if (customer) {
      return remoteWishlist;
    }

    const productMap = new Map(
      getMarketplaceProducts().map((product) => [product.id, product]),
    );

    return localWishlistEntries
      .map((entry) => {
        const product = productMap.get(entry.productId);

        if (!product) {
          return null;
        }

        return {
          ...entry,
          product,
        };
      })
      .filter(Boolean)
      .sort(
        (firstItem, secondItem) =>
          new Date(secondItem.addedAt) - new Date(firstItem.addedAt),
      );
  }, [customer, localWishlistEntries, remoteWishlist]);

  const isInWishlist = (productId, mode = "retail") =>
    wishlistItems.some(
      (entry) => entry.productId === productId && entry.mode === mode,
    );

  const toggleWishlist = async (product, mode = "retail") => {
    const normalizedMode = mode === "wholesale" ? "wholesale" : "retail";

    if (customer) {
      const exists = isInWishlist(product.id, normalizedMode);

      try {
        if (exists) {
          await userApi.deleteWishlistItem(product.id, normalizedMode);
          setRemoteWishlist((currentEntries) =>
            currentEntries.filter(
              (entry) =>
                !(
                  entry.productId === product.id && entry.mode === normalizedMode
                ),
            ),
          );
          return;
        }

        const response = await userApi.addWishlistItem({
          productId: product.id,
          mode: normalizedMode,
        });

        const normalizedItem = {
          productId: response.data.productId,
          mode: String(response.data.mode || "").toLowerCase(),
          addedAt: response.data.createdAt,
          product: normalizeProductRecord(response.data.product),
        };

        setRemoteWishlist((currentEntries) => [
          normalizedItem,
          ...currentEntries.filter(
            (entry) =>
              !(
                entry.productId === normalizedItem.productId &&
                entry.mode === normalizedItem.mode
              ),
          ),
        ]);
      } catch (error) {
        alert(error.message || "Unable to update wishlist.");
      }

      return;
    }

    setWishlistStore((currentStore) => {
      const currentEntries = currentStore[wishlistScope] || [];
      const exists = currentEntries.some(
        (entry) =>
          entry.productId === product.id && entry.mode === normalizedMode,
      );

      if (exists) {
        return {
          ...currentStore,
          [wishlistScope]: currentEntries.filter(
            (entry) =>
              !(
                entry.productId === product.id && entry.mode === normalizedMode
              ),
          ),
        };
      }

      return {
        ...currentStore,
        [wishlistScope]: [
          {
            productId: product.id,
            mode: normalizedMode,
            addedAt: new Date().toISOString(),
          },
          ...currentEntries,
        ],
      };
    });
  };

  const removeFromWishlist = async (productId, mode = "retail") => {
    if (customer) {
      try {
        await userApi.deleteWishlistItem(productId, mode);
        setRemoteWishlist((currentEntries) =>
          currentEntries.filter(
            (entry) => !(entry.productId === productId && entry.mode === mode),
          ),
        );
      } catch (error) {
        alert(error.message || "Unable to remove wishlist item.");
      }
      return;
    }

    setWishlistStore((currentStore) => ({
      ...currentStore,
      [wishlistScope]: (currentStore[wishlistScope] || []).filter(
        (entry) => !(entry.productId === productId && entry.mode === mode),
      ),
    }));
  };

  const clearWishlist = async () => {
    if (customer) {
      const currentItems = [...remoteWishlist];
      await Promise.all(
        currentItems.map((entry) =>
          userApi.deleteWishlistItem(entry.productId, entry.mode),
        ),
      ).catch(() => {});
      setRemoteWishlist([]);
      return;
    }

    setWishlistStore((currentStore) => ({
      ...currentStore,
      [wishlistScope]: [],
    }));
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export default WishlistProvider;
