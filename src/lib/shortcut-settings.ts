export type ShortcutBinding = Readonly<{
  key: string;
  shift: boolean;
  alt: boolean;
}>;

export type ShortcutSettings = Readonly<{
  search: ShortcutBinding;
  commandPrompt: ShortcutBinding;
}>;

type ShortcutTarget = keyof ShortcutSettings;

const KEYBINDS_STORAGE_KEY = "better-issues.shortcuts.v1";
const MODIFIER_KEYS = new Set(["meta", "control", "alt", "shift"]);

export const DEFAULT_SHORTCUTS: ShortcutSettings = {
  search: { key: "k", shift: false, alt: false },
  commandPrompt: { key: "p", shift: true, alt: false },
};

const cloneDefaults = (): ShortcutSettings => ({
  search: { ...DEFAULT_SHORTCUTS.search },
  commandPrompt: { ...DEFAULT_SHORTCUTS.commandPrompt },
});

export const normalizeShortcutKey = (rawKey: string): string | null => {
  const lowered = rawKey.toLowerCase();
  if (lowered === " ") return "space";

  const normalized = lowered.trim();
  if (normalized.length === 0 || MODIFIER_KEYS.has(normalized)) return null;
  if (normalized === "escape") return "esc";
  if (normalized.startsWith("arrow")) return normalized.slice("arrow".length);
  if (normalized.length === 1) return normalized;
  return normalized;
};

const sanitizeBinding = (value: unknown, fallback: ShortcutBinding): ShortcutBinding => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...fallback };
  }

  const candidate = value as {
    key?: unknown;
    shift?: unknown;
    alt?: unknown;
  };

  if (
    typeof candidate.key !== "string" ||
    typeof candidate.shift !== "boolean" ||
    typeof candidate.alt !== "boolean"
  ) {
    return { ...fallback };
  }

  const normalizedKey = normalizeShortcutKey(candidate.key);
  if (!normalizedKey) {
    return { ...fallback };
  }

  return {
    key: normalizedKey,
    shift: candidate.shift,
    alt: candidate.alt,
  };
};

const sanitizeSettings = (value: unknown): ShortcutSettings => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return cloneDefaults();
  }

  const candidate = value as {
    search?: unknown;
    commandPrompt?: unknown;
  };

  return {
    search: sanitizeBinding(candidate.search, DEFAULT_SHORTCUTS.search),
    commandPrompt: sanitizeBinding(candidate.commandPrompt, DEFAULT_SHORTCUTS.commandPrompt),
  };
};

export const readShortcutSettings = (): ShortcutSettings => {
  if (typeof window === "undefined") {
    return cloneDefaults();
  }

  const stored = window.localStorage.getItem(KEYBINDS_STORAGE_KEY);
  if (!stored) {
    return cloneDefaults();
  }

  try {
    return sanitizeSettings(JSON.parse(stored) as unknown);
  } catch {
    return cloneDefaults();
  }
};

const writeShortcutSettings = (settings: ShortcutSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(settings));
};

export const formatShortcut = (binding: ShortcutBinding): string => {
  const parts = ["Ctrl/Cmd"];
  if (binding.shift) parts.push("Shift");
  if (binding.alt) parts.push("Alt");
  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);
  return parts.join(" + ");
};

export const shortcutBindingsEqual = (left: ShortcutBinding, right: ShortcutBinding): boolean =>
  left.key === right.key && left.shift === right.shift && left.alt === right.alt;

export const updateShortcutSetting = (target: ShortcutTarget, binding: ShortcutBinding) => {
  const current = readShortcutSettings();
  const next = {
    ...current,
    [target]: {
      key: binding.key,
      shift: binding.shift,
      alt: binding.alt,
    },
  };
  writeShortcutSettings(next);
  return next;
};

export const resetShortcutSettings = () => {
  const defaults = cloneDefaults();
  writeShortcutSettings(defaults);
  return defaults;
};

const formatShortcutKey = (key: string): string => {
  if (key.length === 1) return key.toUpperCase();
  if (/^f\d{1,2}$/i.test(key)) return key.toUpperCase();

  const aliases: Record<string, string> = {
    esc: "Esc",
    space: "Space",
    up: "Up",
    down: "Down",
    left: "Left",
    right: "Right",
    enter: "Enter",
    tab: "Tab",
    backspace: "Backspace",
    delete: "Delete",
  };

  return aliases[key] ?? `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
};

export const getShortcutDisplayParts = (binding: ShortcutBinding): readonly string[] => {
  const parts: string[] = ["⌘/Ctrl"];
  if (binding.shift) parts.push("⇧");
  if (binding.alt) parts.push("⌥/Alt");
  parts.push(formatShortcutKey(binding.key));
  return parts;
};

export const matchesShortcut = (event: KeyboardEvent, binding: ShortcutBinding): boolean => {
  const hasModifier = event.metaKey || event.ctrlKey;
  if (!hasModifier || event.shiftKey !== binding.shift || event.altKey !== binding.alt) {
    return false;
  }
  const key = normalizeShortcutKey(event.key);
  return key !== null && key === binding.key;
};
