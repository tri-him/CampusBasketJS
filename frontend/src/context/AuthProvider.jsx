import { useEffect, useState } from "react";
import AuthContext from "./AuthContext";
import { authApi, authStorage, userApi } from "../services/api";

const SELLER_USER_KEY = "CampusBasket-user";
const readStoredUser = () => {
  try {
    const savedUser = localStorage.getItem(SELLER_USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem(SELLER_USER_KEY);
    return null;
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(Boolean(authStorage.getToken("seller")));

  useEffect(() => {
    const bootstrap = async () => {
      const token = authStorage.getToken("seller");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.me("seller");
        setUser(response.data);
        localStorage.setItem(SELLER_USER_KEY, JSON.stringify(response.data));
      } catch {
        authStorage.clearToken("seller");
        localStorage.removeItem(SELLER_USER_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const register = async (newUser) => {
    try {
      const response = await authApi.registerSeller(newUser);
      authStorage.setToken("seller", response.data.token);
      localStorage.setItem(SELLER_USER_KEY, JSON.stringify(response.data.user));
      setUser(response.data.user);
      return true;
    } catch (error) {
      alert(error.message || "Unable to create seller account.");
      return false;
    }
  };

  const login = async (email, password, role = "SELLER") => {
    try {
      const response = await authApi.login({
        email,
        password,
        role,
      });

      authStorage.setToken("seller", response.data.token);
      localStorage.setItem(SELLER_USER_KEY, JSON.stringify(response.data.user));
      setUser(response.data.user);
      return true;
    } catch (error) {
      alert(error.message || "Unable to sign in.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    authStorage.clearToken("seller");
    localStorage.removeItem(SELLER_USER_KEY);
  };

  const updateProfile = async (profileUpdates) => {
    try {
      const response = await userApi.updateProfile(profileUpdates, "seller");
      localStorage.setItem(SELLER_USER_KEY, JSON.stringify(response.data));
      setUser(response.data);
      return response.data;
    } catch (error) {
      alert(error.message || "Unable to update seller profile.");
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        logout,
        updateProfile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
