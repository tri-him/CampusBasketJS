import { useEffect, useState } from "react";
import BusinessModeContext from "./BusinessModeContext";

const BUSINESS_MODE_KEY = "CampusBasket-business-mode";

const BusinessModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem(BUSINESS_MODE_KEY);
    return savedMode === "wholesale" ? "wholesale" : "retail";
  });

  useEffect(() => {
    localStorage.setItem(BUSINESS_MODE_KEY, mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === "retail" ? "wholesale" : "retail"));
  };

  return (
    <BusinessModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </BusinessModeContext.Provider>
  );
};

export default BusinessModeProvider;
