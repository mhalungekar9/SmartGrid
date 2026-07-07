import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@gridnexa/react/index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/variables.css";
import "./styles/app.css";
import "./index.css";
import App from "./App.tsx";
import gridNexaFavicon from "./assets/GridNexa-Without-Text-Logo-transparent.png";

const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");

if (favicon) {
  favicon.href = gridNexaFavicon;
  favicon.type = "image/png";
}

document.title = "GridNexa | Free React Data Grid with Excel-like Features";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
