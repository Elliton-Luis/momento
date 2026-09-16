import { findCurrent, findNext, loadActivities } from "./routine.js";

// Renders the current activity, the discreet next activity and the live clock.
export function startMainView() {
  const clockEl = document.getElementById("clock");
  const currentEl = document.getElementById("current-block");
  const nextEl = document.getElementById("next-block");

  function tick() {
    const now = new Date();
    clockEl.textContent = formatClock(now);
    const activities = loadActivities();
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    renderCurrent(currentEl, findCurrent(activities, nowMinutes), activities.length);
    renderNext(nextEl, findNext(activities, nowMinutes));
  }

  tick();
  setInterval(tick, 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
}

function renderCurrent(container, current, totalCount) {
  container.replaceChildren();
  if (current) {
    container.append(timeRange(current), activityName(current), ...description(current));
    return;
  }
  const note = document.createElement("p");
  note.className = "empty-note";
  note.textContent = totalCount === 0 ? "Nenhuma atividade cadastrada." : "Nada programado para agora.";
  container.append(note);
  if (totalCount === 0) {
    const hint = document.createElement("p");
    hint.className = "empty-hint";
    hint.textContent = "Use “Cadastrar rotina” para começar.";
    container.append(hint);
  }
}

function renderNext(container, next) {
  container.replaceChildren();
  if (!next) return;
  const line = document.createElement("p");
  const range = document.createElement("span");
  range.className = "next-time";
  range.textContent = `${next.start}–${next.end}`;
  line.append(range, ` ${next.name}`);
  container.append(line);
}

function timeRange(activity) {
  const range = document.createElement("p");
  range.className = "current-time";
  range.textContent = `${activity.start}–${activity.end}`;
  return range;
}

function activityName(activity) {
  const name = document.createElement("h1");
  name.className = "current-name";
  name.textContent = activity.name;
  return name;
}

function description(activity) {
  if (!activity.description) return [];
  const text = document.createElement("p");
  text.className = "current-description";
  text.textContent = activity.description;
  return [text];
}

function formatClock(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
