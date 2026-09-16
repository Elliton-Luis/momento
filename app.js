import { startMainView } from "./main-view.js";
import { startManageView } from "./manage-view.js";

// Bootstrap: wire view switching, delegate rendering to each view.
const mainView = document.getElementById("main-view");
const manageView = document.getElementById("manage-view");

function showManage(manage) {
  mainView.hidden = manage;
  manageView.hidden = !manage;
}

document.getElementById("go-manage").addEventListener("click", () => showManage(true));
document.getElementById("go-main").addEventListener("click", () => showManage(false));

startMainView();
startManageView();
