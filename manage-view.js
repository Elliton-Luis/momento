import {
  ROUTINE_STORAGE_KEY,
  createActivity,
  loadActivities,
  saveActivities,
  sortActivities,
  validateActivity,
} from "./routine.js";

// Routine administration: chronological list plus add/edit/delete form.
export function startManageView() {
  const listEl = document.getElementById("routine-list");
  const form = document.getElementById("activity-form");
  const formTitle = document.getElementById("form-title");
  const startField = document.getElementById("field-start");
  const endField = document.getElementById("field-end");
  const nameField = document.getElementById("field-name");
  const descriptionField = document.getElementById("field-description");
  const errorEl = document.getElementById("form-error");
  const cancelButton = document.getElementById("form-cancel");

  let editingId = null;

  function refresh() {
    renderList(listEl, loadActivities(), { onEdit, onDelete });
  }

  function onEdit(activity) {
    editingId = activity.id;
    startField.value = activity.start;
    endField.value = activity.end;
    nameField.value = activity.name;
    descriptionField.value = activity.description ?? "";
    formTitle.textContent = "Editar atividade";
    cancelButton.hidden = false;
    hideError();
    startField.focus();
  }

  function onDelete(activity) {
    if (!window.confirm(`Excluir “${activity.name}”?`)) return;
    try {
      saveActivities(loadActivities().filter((item) => item.id !== activity.id));
    } catch (error) {
      showError(`Não foi possível excluir: ${error.message}`);
      return;
    }
    if (editingId === activity.id) resetForm();
    refresh();
  }

  function resetForm() {
    editingId = null;
    form.reset();
    formTitle.textContent = "Nova atividade";
    cancelButton.hidden = true;
    hideError();
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = {
      start: startField.value,
      end: endField.value,
      name: nameField.value,
      description: descriptionField.value,
    };
    const validation = validateActivity(draft);
    if (!validation.ok) {
      showError(validation.error);
      return;
    }
    try {
      const activities = loadActivities();
      if (editingId) {
        const index = activities.findIndex((item) => item.id === editingId);
        if (index === -1) {
          showError("Atividade não encontrada. Comece uma nova.");
          editingId = null;
          return;
        }
        activities[index] = { ...activities[index], ...draft, name: draft.name.trim(), description: draft.description.trim() };
      } else {
        activities.push(createActivity(draft));
      }
      saveActivities(activities);
    } catch (error) {
      showError(`Não foi possível salvar: ${error.message}`);
      return;
    }
    resetForm();
    refresh();
  });

  // Tapping a time field opens the platform clock picker (mobile-friendly).
  function openNativePicker(event) {
    const input = event.currentTarget;
    if (input && typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch (error) {
        console.warn("Could not open native time picker:", error);
      }
    }
  }

  cancelButton.addEventListener("click", resetForm);
  startField.addEventListener("click", openNativePicker);
  endField.addEventListener("click", openNativePicker);
  document.getElementById("go-manage").addEventListener("click", refresh);
  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === ROUTINE_STORAGE_KEY) refresh();
  });

  refresh();
}

function renderList(listEl, activities, { onEdit, onDelete }) {
  listEl.replaceChildren();
  if (activities.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-list";
    empty.textContent = "Rotina vazia. Adicione a primeira atividade abaixo.";
    listEl.append(empty);
    return;
  }
  for (const activity of sortActivities(activities)) {
    listEl.append(routineItem(activity, { onEdit, onDelete }));
  }
}

function routineItem(activity, { onEdit, onDelete }) {
  const item = document.createElement("li");
  item.className = "routine-item";

  const info = document.createElement("div");
  info.className = "routine-item-info";
  const time = document.createElement("div");
  time.className = "routine-item-time";
  time.textContent = `${activity.start}–${activity.end}`;
  const name = document.createElement("div");
  name.className = "routine-item-name";
  name.textContent = activity.name;
  info.append(time, name);
  if (activity.description) {
    const description = document.createElement("div");
    description.className = "routine-item-desc";
    description.textContent = activity.description;
    info.append(description);
  }

  const buttons = document.createElement("div");
  buttons.className = "routine-item-buttons";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "small-button";
  editButton.textContent = "Editar";
  editButton.setAttribute("aria-label", `Editar ${activity.name}`);
  editButton.addEventListener("click", () => onEdit(activity));
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "small-button";
  deleteButton.textContent = "Excluir";
  deleteButton.setAttribute("aria-label", `Excluir ${activity.name}`);
  deleteButton.addEventListener("click", () => onDelete(activity));
  buttons.append(editButton, deleteButton);

  item.append(info, buttons);
  return item;
}
