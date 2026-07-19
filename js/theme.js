/* theme switcher: system | dark | light, persisted in localStorage */
import { L } from "./i18n.js";

const MODES = ["system", "dark", "light"];

export function initTheme() {
  const themeBtn = document.getElementById("themeBtn");
  const sysDark = matchMedia("(prefers-color-scheme: dark)");
  let mode = localStorage.getItem("stera-theme");
  if (!MODES.includes(mode)) mode = "system";

  // the browser loads the icon file once and mutating the existing link's
  // href is not reliably picked up — replacing the link node is
  function updateFavicon() {
    const dark = mode === "system" ? sysDark.matches : mode === "dark";
    document.querySelector('link[rel="icon"]')?.remove();
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = dark ? "assets/favicon-dark.svg" : "assets/favicon-light.svg";
    document.head.appendChild(link);
  }
  sysDark.addEventListener("change", updateFavicon);

  function apply(m) {
    mode = m;
    try { localStorage.setItem("stera-theme", m); } catch (e) {}
    if (m === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = m;
    // keep the i18n key on the button so language switches relabel it too
    themeBtn.dataset.i18n = "theme." + m;
    themeBtn.textContent = L.dom["theme." + m];
    updateFavicon();
  }

  apply(mode);
  themeBtn.addEventListener("click", () => {
    apply(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
  });
}
