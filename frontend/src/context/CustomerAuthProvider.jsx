import { useEffect, useState } from "react";
import CustomerAuthContext from "./CustomerAuthContext";
import { authApi, authStorage, userApi } from "../services/api";

const CUSTOMER_KEY = "CampusBasket-customer-user";
const readStoredCustomer = () => {
  try {
    const savedCustomer = localStorage.getItem(CUSTOMER_KEY);
    return savedCustomer ? JSON.parse(savedCustomer) : null;
  } catch {
    localStorage.removeItem(CUSTOMER_KEY);
    return null;
  }
};

function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => readStoredCustomer());
  const [loading, setLoading] = useState(Boolean(authStorage.getToken("customer")));

  useEffect(() => {
    const bootstrap = async () => {
      const token = authStorage.getToken("customer");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.me("customer");
        setCustomer(response.data);
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(response.data));
      } catch {
        authStorage.clearToken("customer");
        localStorage.removeItem(CUSTOMER_KEY);
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const registerCustomer = async (newCustomer) => {
    try {
      const response = await authApi.registerCustomer(newCustomer);
      authStorage.setToken("customer", response.data.token);
      setCustomer(response.data.user);
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(response.data.user));
      return true;
    } catch (error) {
      return error.message || "Unable to create customer account.";
    }
  };

  const loginCustomer = async (email, password) => {
    try {
      const response = await authApi.login({
        email,
        password,
        role: "CUSTOMER",
      });

      authStorage.setToken("customer", response.data.token);
      setCustomer(response.data.user);
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(response.data.user));
      return true;
    } catch (error) {
      return error.message || "Invalid email or password. Please try again.";
    }
  };

  const logoutCustomer = () => {
    setCustomer(null);
    authStorage.clearToken("customer");
    localStorage.removeItem(CUSTOMER_KEY);
  };

  const updateCustomerProfile = async (profileUpdates) => {
    if (!customer) {
      return false;
    }

    try {
      const response = await userApi.updateProfile(profileUpdates);
      setCustomer(response.data);
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(response.data));
      return true;
    } catch (error) {
      alert(error.message || "Unable to update profile.");
      return false;
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        registerCustomer,
        loginCustomer,
        logoutCustomer,
        updateCustomerProfile,
        loading,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export default CustomerAuthProvider;
