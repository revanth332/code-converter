import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./global.css";
import { Toaster } from "@/components/ui/sonner"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
        <App />
        <Toaster />
    </BrowserRouter>
  </React.StrictMode>
);
