// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthProvider from "./context/AuthProvider";
import "./index.css";
import CartProvider from "./context/CartProvider";
import CustomerAuthProvider from "./context/CustomerAuthProvider";
import { registerSW } from "virtual:pwa-register";

registerSW();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  </React.StrictMode>,
);
