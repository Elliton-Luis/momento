export const ROUTINE_STORAGE_KEY = "momento.routine.v1";

// Parse "HH:MM" into minutes since midnight. Throws on invalid input.
export function toMinutes(timeString) {
  const match = /^(\d{2}):(\d{2})$/.exec(timeString ?? "");
  if (!match) throw new Error(`Invalid time value: ${JSON.stringify(timeString)}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Time out of range: ${timeString}`);
  return hours * 60 + minutes;
}

// Format minutes since midnight back to "HH:MM".
export function toTimeString(totalMinutes) {
  const clamped = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const hours = String(Math.floor(clamped / 60)).padStart(2, "0");
  const minutes = String(clamped % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Activity shape: { id, start: "HH:MM", end: "HH:MM", name, description }
export function createActivity({ start, end, name, description = "" }) {
  return {
    id: makeId(),
    start,
    end,
    name: name.trim(),
    description: description.trim(),
  };
}

// Chronological copy, tie-broken by end time then name.
export function sortActivities(activities) {
  return [...activities].sort((a, b) => {
    const startDiff = toMinutes(a.start) - toMinutes(b.start);
    if (startDiff !== 0) return startDiff;
    const endDiff = toMinutes(a.end) - toMinutes(b.end);
    if (endDiff !== 0) return endDiff;
    return a.name.localeCompare(b.name);
  });
}

// Validate raw form values. Returns { ok, error } with a user-facing message.
export function validateActivity({ start, end, name }) {
  if (!start || !end) return { ok: false, error: "Preencha início e fim." };
  if (!name || !name.trim()) return { ok: false, error: "Dê um nome à atividade." };
  let startMinutes;
  let endMinutes;
  try {
    startMinutes = toMinutes(start);
    endMinutes = toMinutes(end);
  } catch (error) {
    return { ok: false, error: "Horário inválido. Use o formato HH:MM." };
  }
  if (endMinutes <= startMinutes) {
    return { ok: false, error: "O fim deve ser depois do início." };
  }
  return { ok: true, error: "" };
}

// Current activity: start <= now < end (end-exclusive, back-to-back never overlap).
export function findCurrent(activities, nowMinutes) {
  return activities.find((activity) => {
    return toMinutes(activity.start) <= nowMinutes && nowMinutes < toMinutes(activity.end);
  }) ?? null;
}

// Next activity: smallest start strictly after now.
export function findNext(activities, nowMinutes) {
  let next = null;
  for (const activity of activities) {
    if (toMinutes(activity.start) <= nowMinutes) continue;
    if (!next || toMinutes(activity.start) < toMinutes(next.start)) next = activity;
  }
  return next;
}

export function loadActivities(storage = defaultStorage()) {
  let raw = null;
  try {
    raw = storage.getItem(ROUTINE_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to read routine from storage:", error);
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Stored routine is not a list");
    return sortActivities(parsed.filter(isStoredActivity));
  } catch (error) {
    console.warn("Failed to parse stored routine, starting empty:", error);
    return [];
  }
}

export function saveActivities(activities, storage = defaultStorage()) {
  try {
    storage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(sortActivities(activities)));
  } catch (error) {
    throw new Error(`Failed to save routine (${activities.length} activities): ${error.message}`);
  }
}

function isStoredActivity(activity) {
  return (
    activity &&
    typeof activity.id === "string" &&
    typeof activity.start === "string" &&
    typeof activity.end === "string" &&
    typeof activity.name === "string" &&
    validateActivity(activity).ok
  );
}

function defaultStorage() {
  if (typeof localStorage !== "undefined") return localStorage;
  throw new Error("No storage available: localStorage is missing");
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
