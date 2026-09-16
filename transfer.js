import { toMinutes, validateActivity } from "./routine.js";

// Routine transfer: plain-text import plus JSON export/import.
// Text drafts and JSON drafts are plain { start, end, name, description };
// ids are assigned by the caller on save, so exports stay implementation-free.

const TIME = "([01]?\\d|2[0-3]):([0-5]\\d)";
const ACTIVITY_LINE = new RegExp(
  `^(?:\\*\\*)?${TIME}(?:\\*\\*)?` + // start, optional **bold**
    `(?:\\s*[-–—]\\s*(?:\\*\\*)?${TIME}(?:\\*\\*)?)?` + // optional end range
    `\\s*(?:[-–—:]\\s*)?(.*)$` // optional separator, then name
);
const BULLET = /^(?:[-*+]|\d+[.)])\s+/;
const HEADING_OR_RULE = /^(#{1,6}\s+|[-*_]{3,}\s*$)/;
const TIME_ATTEMPT = /\d{1,2}\s*[:h]/;

// Parse a Markdown/TXT routine into { activities, skipped }.
// Supported lines (documented in README):
//   - **06:40–07:20** — Name | optional description
//   - bullets, bold, -, –, — and : separators are all accepted
// A lone start time ends when the next activity starts; without a
// following activity the line is reported in skipped, never dropped silently.
export function parseRoutineText(text) {
  const parsed = [];
  const skipped = [];
  const lines = String(text ?? "").split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();
    if (!trimmed || HEADING_OR_RULE.test(trimmed)) return;

    const withoutBullet = trimmed.replace(BULLET, "");
    const hadBullet = withoutBullet !== trimmed;
    const match = ACTIVITY_LINE.exec(withoutBullet);
    if (!match) {
      if (hadBullet || TIME_ATTEMPT.test(trimmed)) {
        skipped.push({ line: lineNumber, text: rawLine.trim(), reason: "Horário não reconhecido. Use HH:MM ou HH:MM–HH:MM." });
      }
      return;
    }

    const start = `${match[1].padStart(2, "0")}:${match[2]}`;
    const end = match[3] !== undefined ? `${match[3].padStart(2, "0")}:${match[4]}` : null;
    const { name, description } = splitDescription((match[5] ?? "").trim());
    if (!name) {
      skipped.push({ line: lineNumber, text: rawLine.trim(), reason: "Nome da atividade ausente." });
      return;
    }
    parsed.push({ start, end, name, description, line: lineNumber, text: rawLine.trim() });
  });

  parsed.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 0; i < parsed.length; i += 1) {
    if (parsed[i].end) continue;
    const next = parsed.slice(i + 1).find((candidate) => toMinutes(candidate.start) > toMinutes(parsed[i].start));
    if (!next) {
      skipped.push({ line: parsed[i].line, text: parsed[i].text, reason: "Sem fim determinável: não há próxima atividade." });
      parsed[i] = null;
    } else {
      parsed[i].end = next.start;
    }
  }

  const activities = [];
  for (const entry of parsed) {
    if (!entry) continue;
    const validation = validateActivity(entry);
    if (!validation.ok) {
      skipped.push({ line: entry.line, text: entry.text, reason: validation.error });
      continue;
    }
    activities.push({ start: entry.start, end: entry.end, name: entry.name, description: entry.description });
  }
  return { activities, skipped };
}

function splitDescription(nameAndDescription) {
  const separator = nameAndDescription.indexOf("|");
  if (separator === -1) return { name: nameAndDescription, description: "" };
  return {
    name: nameAndDescription.slice(0, separator).trim(),
    description: nameAndDescription.slice(separator + 1).trim(),
  };
}
