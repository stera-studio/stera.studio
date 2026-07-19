/* theme switcher: system | dark | light, persisted in localStorage */
import { L } from "./i18n.js";

const MODES = ["system", "dark", "light"];

export function initTheme() {
  const themeBtn = document.getElementById("themeBtn");
  let mode = localStorage.getItem("stera-theme");
  if (!MODES.includes(mode)) mode = "system";

  function apply(m) {
    mode = m;
    try { localStorage.setItem("stera-theme", m); } catch (e) {}
    if (m === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = m;
    // keep the i18n key on the button so language switches relabel it too
    themeBtn.dataset.i18n = "theme." + m;
    themeBtn.textContent = L.dom["theme." + m];
  }

  apply(mode);
  themeBtn.addEventListener("click", () => {
    apply(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
  });
}
