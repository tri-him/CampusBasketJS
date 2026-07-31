const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const apiBaseUrl = API_BASE_URL;

const TOKEN_KEYS = {
  seller: "CampusBasket-seller-token",
  admin: "CampusBasket-seller-token",
  customer: "CampusBasket-customer-token",
};

export const authStorage = {
  getToken(scope) {
    return localStorage.getItem(TOKEN_KEYS[scope]);
  },
  setToken(scope, token) {
    if (token) {
      localStorage.setItem(TOKEN_KEYS[scope], token);
    }
  },
  clearToken(scope) {
    localStorage.removeItem(TOKEN_KEYS[scope]);
  },
};

const extractApiErrorMessage = (data) => {
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (Array.isArray(data)) {
    return data[0]?.message || "API request failed.";
  }

  if (Array.isArray(data?.details)) {
    return data.details[0]?.message || "API request failed.";
  }

  const fieldErrors = data?.details?.fieldErrors;

  if (fieldErrors && typeof fieldErrors === "object") {
    const firstFieldError = Object.values(fieldErrors)
      .flat()
      .find((message) => typeof message === "string" && message.trim());

    if (firstFieldError) {
      return firstFieldError;
    }
  }

  return "API request failed.";
};

async function request(path, options = {}, authScope = null) {
  const token =
    authScope === "seller" || authScope === "customer" || authScope === "admin"
      ? authStorage.getToken(authScope)
      : authStorage.getToken("customer") || authStorage.getToken("seller");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data));
  }

  return data;
}

export const authApi = {
  registerSeller: (payload) =>
    request("/auth/register/seller", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  registerCustomer: (payload) =>
    request("/auth/register/customer", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: (scope) => request("/auth/me", {}, scope),
};

export const productApi = {
  landingHighlights: () => request("/products/landing/highlights"),
  list: (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, value);
      }
    });

    const queryString = searchParams.toString();
    return request(`/products${queryString ? `?${queryString}` : ""}`);
  },
  getById: (productId) => request(`/products/${productId}`),
  create: (payload) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }, "seller"),
  update: (productId, payload) =>
    request(`/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }, "seller"),
  remove: (productId) =>
    request(`/products/${productId}`, {
      method: "DELETE",
    }, "seller"),
};

export const orderApi = {
  create: (payload) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }, "customer"),
  myOrders: () => request("/orders/my", {}, "customer"),
  sellerOrders: () => request("/orders/seller", {}, "seller"),
  history: (email) =>
    request(
      `/orders/history${email ? `?email=${encodeURIComponent(email)}` : ""}`,
      {},
      "customer",
    ),
  getById: (orderId, email = "") =>
    request(
      `/orders/${orderId}${email ? `?email=${encodeURIComponent(email)}` : ""}`,
      {},
      "customer",
    ),
  cancel: (orderId) =>
    request(`/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    }, "customer"),
  updateSellerStatus: (orderId, status) =>
    request(`/orders/${orderId}/items/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }, "seller"),
};

export const paymentApi = {
  createRazorpayOrder: (payload) =>
    request("/payments/razorpay/order", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  retryRazorpayOrder: (payload) =>
    request("/payments/razorpay/retry", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyRazorpayPayment: (payload) =>
    request("/payments/razorpay/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  cancelRazorpayOrder: (payload) =>
    request("/payments/razorpay/cancel", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const reviewApi = {
  listByProductId: (productId) => request(`/reviews/product/${productId}`),
  create: (payload) =>
    request("/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const cartApi = {
  list: () => request("/cart", {}, "customer"),
  sync: (items) =>
    request(
      "/cart/sync",
      {
        method: "POST",
        body: JSON.stringify({ items }),
      },
      "customer",
    ),
  addItem: (payload) =>
    request(
      "/cart/items",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "customer",
    ),
  updateItem: (productId, payload) =>
    request(
      `/cart/items/${productId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      "customer",
    ),
  removeItem: (productId, mode) =>
    request(
      `/cart/items/${productId}${mode ? `?mode=${encodeURIComponent(mode)}` : ""}`,
      {
        method: "DELETE",
      },
      "customer",
    ),
  clear: () =>
    request(
      "/cart",
      {
        method: "DELETE",
      },
      "customer",
    ),
};

export const supportApi = {
  listTickets: (email = "") =>
    request(`/support/tickets${email ? `?email=${encodeURIComponent(email)}` : ""}`, {}, "customer"),
  createTicket: (payload) =>
    request("/support/tickets", {
      method: "POST",
      body: JSON.stringify(payload),
    }, "customer"),
  listChats: (email = "") =>
    request(`/support/chats${email ? `?email=${encodeURIComponent(email)}` : ""}`, {}, "customer"),
  createChat: (payload) =>
    request("/support/chats", {
      method: "POST",
      body: JSON.stringify(payload),
    }, "customer"),
  sendMessage: (chatId, payload) =>
    request(`/support/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    }, "customer"),
  markChatRead: (chatId, payload = {}) =>
    request(`/support/chats/${chatId}/read`, {
      method: "POST",
      body: JSON.stringify(payload),
    }, "customer"),
  customerStreamUrl: (email = "") => {
    const searchParams = new URLSearchParams();
    const token = authStorage.getToken("customer");

    if (email) {
      searchParams.set("email", email);
    }

    if (token) {
      searchParams.set("token", token);
    }

    const queryString = searchParams.toString();
    return `${API_BASE_URL}/support/stream${queryString ? `?${queryString}` : ""}`;
  },
  adminOverview: () => request("/support/admin/overview", {}, "admin"),
  adminTickets: (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, value);
      }
    });

    const queryString = searchParams.toString();
    return request(`/support/admin/tickets${queryString ? `?${queryString}` : ""}`, {}, "admin");
  },
  adminChats: (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, value);
      }
    });

    const queryString = searchParams.toString();
    return request(`/support/admin/chats${queryString ? `?${queryString}` : ""}`, {}, "admin");
  },
  updateAdminTicket: (ticketId, payload) =>
    request(`/support/admin/tickets/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }, "admin"),
  updateAdminChat: (chatId, payload) =>
    request(`/support/admin/chats/${chatId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }, "admin"),
  sendAdminMessage: (chatId, payload) =>
    request(`/support/admin/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    }, "admin"),
  markAdminChatRead: (chatId) =>
    request(`/support/admin/chats/${chatId}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    }, "admin"),
  adminStreamUrl: () => {
    const token = authStorage.getToken("admin");
    const searchParams = new URLSearchParams();

    if (token) {
      searchParams.set("token", token);
    }

    const queryString = searchParams.toString();
    return `${API_BASE_URL}/support/admin/stream${queryString ? `?${queryString}` : ""}`;
  },
};

export const userApi = {
  updateProfile: (payload, scope = "customer") =>
    request("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }, scope),
  adminList: (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, value);
      }
    });

    const queryString = searchParams.toString();
    return request(`/users/admin${queryString ? `?${queryString}` : ""}`, {}, "admin");
  },
  adminUpdateStatus: (userId, payload) =>
    request(`/users/admin/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }, "admin"),
  getShippingDraft: () => request("/users/me/shipping-draft", {}, "customer"),
  saveShippingDraft: (payload) =>
    request("/users/me/shipping-draft", {
      method: "PUT",
      body: JSON.stringify(payload),
    }, "customer"),
  clearShippingDraft: () =>
    request("/users/me/shipping-draft", {
      method: "DELETE",
    }, "customer"),
  listAddresses: () => request("/users/me/addresses", {}, "customer"),
  createAddress: (payload) =>
    request("/users/me/addresses", {
      method: "POST",
      body: JSON.stringify(payload),
    }, "customer"),
  deleteAddress: (addressId) =>
    request(`/users/me/addresses/${addressId}`, {
      method: "DELETE",
    }, "customer"),
  listWishlist: () => request("/users/me/wishlist", {}, "customer"),
  addWishlistItem: (payload) =>
    request("/users/me/wishlist", {
      method: "POST",
      body: JSON.stringify(payload),
    }, "customer"),
  deleteWishlistItem: (productId, mode) =>
    request(
      `/users/me/wishlist/${productId}${mode ? `?mode=${encodeURIComponent(mode)}` : ""}`,
      {
        method: "DELETE",
      },
      "customer",
    ),
};

export const healthApi = {
  status: () => request("/health"),
};

export default {
  authApi,
  productApi,
  orderApi,
  reviewApi,
  supportApi,
  userApi,
  cartApi,
  paymentApi,
  healthApi,
  authStorage,
};
