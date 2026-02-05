
  import { createRoot } from "react-dom/client";
  import { BrowserRouter } from "react-router-dom";
  import App from "./App.tsx";
  import "./index.css";
  import { logAction } from "./utils/logAction";

  // App load
  try {
    logAction("app.load", { href: window.location.href });
  } catch (err) {}

  // Global form submit / reset logging
  if (typeof document !== "undefined") {
    document.addEventListener(
      "submit",
      (e) => {
        try {
          const form = e.target as HTMLFormElement;
          logAction("form.submit", { id: form.id || null, action: form.action || null });
        } catch (err) {}
      },
      true,
    );

    document.addEventListener(
      "reset",
      (e) => {
        try {
          const form = e.target as HTMLFormElement;
          logAction("form.reset", { id: form.id || null });
        } catch (err) {}
      },
      true,
    );

    document.addEventListener(
      "click",
      (e) => {
        try {
          const t = e.target as HTMLElement;
          if (t && t.tagName === "A") {
            const a = t as HTMLAnchorElement;
            logAction("link.click", { href: a.href });
          }
        } catch (err) {}
      },
      true,
    );
  }

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  
