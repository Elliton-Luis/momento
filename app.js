import { startMainView } from "./main-view.js";
import { startManageView } from "./manage-view.js";
import { applyTheme, getStoredTheme, resolveTheme, systemTheme, toggleTheme } from "./theme.js";

// Bootstrap: wire view switching, delegate rendering to each view.
const mainView = document.getElementById("main-view");
const manageView = document.getElementById("manage-view");

function showManage(manage) {
  mainView.hidden = manage;
  manageView.hidden = !manage;
}

document.getElementById("go-manage").addEventListener("click", () => showManage(true));
document.getElementById("go-main").addEventListener("click", () => showManage(false));

// Manual theme choice wins over the system; persist it across sessions.
applyTheme(resolveTheme(getStoredTheme(), systemTheme()));
for (const button of document.querySelectorAll(".theme-toggle")) {
  button.addEventListener("click", () => {
    try {
      toggleTheme();
    } catch (error) {
      console.warn("Theme preference was applied but not saved:", error);
    }
  });
}

// Keep open tabs in sync when the choice changes elsewhere.
// Re-read storage: the local dataset may hold the previous tab's value.
window.addEventListener("storage", (event) => {
  if (event.key === null || event.key === "momento.theme.v1") {
    applyTheme(resolveTheme(getStoredTheme(), systemTheme()));
  }
});

startMainView();
startManageView();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
