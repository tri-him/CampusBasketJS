import { useEffect, useRef, useState } from "react";
import { cartApi } from "../services/api";
import { resolveProductMediaUrl } from "../lib/productMedia";
import { CartContext } from "./Cartcontext";
import useCustomerAuth from "./useCustomerAuth";

const GUEST_CART_KEY = "CampusBasket-cart";

const getItemMode = (mode) => (mode === "wholesale" ? "wholesale" : "retail");

const getUnitPrice = (item) =>
  getItemMode(item.mode) === "wholesale"
    ? Number(item.wholesalePrice) || 0
    : Number(item.retailPrice) || 0;

const getMinimumQuantity = (item, mode = item.mode) =>
  getItemMode(mode) === "wholesale" ? Number(item.minWholesaleQty) || 1 : 1;

const normalizeCartItem = (item) => {
  const mode = getItemMode(item.mode);
  const minimumQuantity = getMinimumQuantity(item, mode);
  const rawQuantity = Number(item.quantity);

  return {
    ...item,
    mode,
    quantity:
      Number.isFinite(rawQuantity) && rawQuantity >= minimumQuantity
        ? rawQuantity
        : minimumQuantity,
  };
};

const readGuestCart = () => {
  try {
    const savedCart = localStorage.getItem(GUEST_CART_KEY);

    if (!savedCart) {
      return [];
    }

    const parsedCart = JSON.parse(savedCart);
    return Array.isArray(parsedCart) ? parsedCart.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (cart) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

const normalizeServerCartItem = (item) =>
  normalizeCartItem({
    id: item.product.id,
    productId: item.product.id,
    sellerId: item.product.sellerId,
    sellerName: item.product.seller?.storeName || item.product.seller?.name || "Seller Store",
    name: item.product.name,
    description: item.product.description || "",
    category: item.product.category || "Eco Essentials",
    catalogType: String(item.product.catalogType || "ALL").toLowerCase(),
    sustainabilityScore: Number(item.product.sustainabilityScore) || 80,
    retailPrice: Number(item.product.retailPrice) || 0,
    wholesalePrice: Number(item.product.wholesalePrice) || 0,
    minWholesaleQty: Number(item.product.minWholesaleQty) || 1,
    inventory: Number(item.product.inventory) || 0,
    image: resolveProductMediaUrl(item.product.imageUrl || ""),
    mode: String(item.mode || "RETAIL").toLowerCase(),
    quantity: Number(item.quantity) || 1,
  });

const normalizeServerCart = (items) =>
  Array.isArray(items) ? items.map(normalizeServerCartItem) : [];

function CartProvider({ children }) {
  const { customer } = useCustomerAuth();
  const customerId = customer?.id || null;
  const [cart, setCart] = useState(() => readGuestCart());
  const previousCustomerIdRef = useRef(customerId);

  useEffect(() => {
    if (!customerId) {
      writeGuestCart(cart);
    }
  }, [cart, customerId]);

  useEffect(() => {
    let cancelled = false;

    const syncCartState = async () => {
      const previousCustomerId = previousCustomerIdRef.current;
      previousCustomerIdRef.current = customerId;

      if (!customerId) {
        if (previousCustomerId) {
          clearGuestCart();
          setCart([]);
          return;
        }

        setCart(readGuestCart());
        return;
      }

      try {
        const guestCart = readGuestCart();
        const response =
          guestCart.length > 0
            ? await cartApi.sync(
                guestCart.map((item) => ({
                  productId: item.id,
                  mode: item.mode,
                  quantity: item.quantity,
                })),
              )
            : await cartApi.list();

        if (!cancelled) {
          setCart(normalizeServerCart(response.data));
          clearGuestCart();
        }
      } catch (error) {
        if (!cancelled) {
          alert(error.message || "Unable to sync your cart.");
        }
      }
    };

    void syncCartState();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const addToCart = async (product, selectedMode = "retail") => {
    const mode = getItemMode(selectedMode);
    const quantityToAdd = getMinimumQuantity(product, mode);

    if (customer) {
      try {
        const response = await cartApi.addItem({
          productId: product.id,
          mode,
          quantity: quantityToAdd,
        });
        setCart(normalizeServerCart(response.data));
      } catch (error) {
        alert(error.message || "Unable to add this item to cart.");
      }

      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id && item.mode === mode,
      );

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id && item.mode === mode
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item,
        );
      }

      return [
        ...currentCart,
        normalizeCartItem({
          ...product,
          mode,
          quantity: quantityToAdd,
        }),
      ];
    });
  };

  const removeFromCart = async (id, mode) => {
    const itemMode = getItemMode(mode);

    if (customer) {
      try {
        const response = await cartApi.removeItem(id, itemMode);
        setCart(normalizeServerCart(response.data));
      } catch (error) {
        alert(error.message || "Unable to remove this item from cart.");
      }

      return;
    }

    setCart((currentCart) =>
      currentCart.filter(
        (item) => !(item.id === id && item.mode === itemMode),
      ),
    );
  };

  const updateQuantity = async (id, mode, qty) => {
    const itemMode = getItemMode(mode);

    if (customer) {
      try {
        const response = await cartApi.updateItem(id, {
          mode: itemMode,
          quantity: Number(qty),
        });
        setCart(normalizeServerCart(response.data));
      } catch (error) {
        alert(error.message || "Unable to update quantity.");
      }

      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id || item.mode !== itemMode) {
          return item;
        }

        const minimumQuantity = getMinimumQuantity(item, itemMode);
        const nextQuantity = Number(qty);

        return {
          ...item,
          quantity:
            Number.isFinite(nextQuantity) && nextQuantity >= minimumQuantity
              ? nextQuantity
              : minimumQuantity,
        };
      }),
    );
  };

  const clearCart = async () => {
    if (customer) {
      try {
        await cartApi.clear();
      } catch (error) {
        alert(error.message || "Unable to clear cart.");
        return;
      }
    }

    setCart([]);
  };

  const total = cart.reduce(
    (sum, item) => sum + getUnitPrice(item) * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
