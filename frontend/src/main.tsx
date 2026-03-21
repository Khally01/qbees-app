import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Global styles
const style = document.createElement("style");
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    background: #f9fafb;
    color: #111827;
    overscroll-behavior: none;
  }
  html { height: -webkit-fill-available; }
  body { min-height: 100vh; min-height: -webkit-fill-available; }
  input, select, textarea, button { font-family: inherit; }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
