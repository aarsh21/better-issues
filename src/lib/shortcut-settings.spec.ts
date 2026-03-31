import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
	normalizeShortcutKey,
	formatShortcut,
	shortcutBindingsEqual,
	matchesShortcut,
	getShortcutDisplayParts,
	readShortcutSettings,
	updateShortcutSetting,
	resetShortcutSettings,
	DEFAULT_SHORTCUTS,
	type ShortcutBinding
} from './shortcut-settings';

// ---------------------------------------------------------------------------
// normalizeShortcutKey
// ---------------------------------------------------------------------------
describe('normalizeShortcutKey', () => {
	it('maps space character to "space"', () => {
		expect(normalizeShortcutKey(' ')).toBe('space');
	});

	it('maps "escape" to "esc"', () => {
		expect(normalizeShortcutKey('Escape')).toBe('esc');
		expect(normalizeShortcutKey('escape')).toBe('esc');
	});

	it('strips "arrow" prefix from arrow keys', () => {
		expect(normalizeShortcutKey('ArrowLeft')).toBe('left');
		expect(normalizeShortcutKey('arrowRight')).toBe('right');
		expect(normalizeShortcutKey('ArrowUp')).toBe('up');
		expect(normalizeShortcutKey('ArrowDown')).toBe('down');
	});

	it('returns null for modifier-only keys', () => {
		expect(normalizeShortcutKey('Meta')).toBeNull();
		expect(normalizeShortcutKey('Control')).toBeNull();
		expect(normalizeShortcutKey('Alt')).toBeNull();
		expect(normalizeShortcutKey('Shift')).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(normalizeShortcutKey('')).toBeNull();
	});

	it('lowercases single characters', () => {
		expect(normalizeShortcutKey('K')).toBe('k');
		expect(normalizeShortcutKey('a')).toBe('a');
		expect(normalizeShortcutKey('Z')).toBe('z');
	});

	it('lowercases multi-character key names', () => {
		expect(normalizeShortcutKey('Enter')).toBe('enter');
		expect(normalizeShortcutKey('Tab')).toBe('tab');
	});
});

// ---------------------------------------------------------------------------
// formatShortcut
// ---------------------------------------------------------------------------
describe('formatShortcut', () => {
	it('returns "Ctrl/Cmd + K" style string for simple binding', () => {
		expect(formatShortcut({ key: 'k', shift: false, alt: false })).toBe('Ctrl/Cmd + K');
	});

	it('includes Shift when binding.shift is true', () => {
		expect(formatShortcut({ key: 'p', shift: true, alt: false })).toBe('Ctrl/Cmd + Shift + P');
	});

	it('includes Alt when binding.alt is true', () => {
		expect(formatShortcut({ key: 'n', shift: false, alt: true })).toBe('Ctrl/Cmd + Alt + N');
	});

	it('includes both Shift and Alt', () => {
		expect(formatShortcut({ key: 'x', shift: true, alt: true })).toBe('Ctrl/Cmd + Shift + Alt + X');
	});

	it('does not uppercase multi-character key names', () => {
		expect(formatShortcut({ key: 'enter', shift: false, alt: false })).toBe('Ctrl/Cmd + enter');
	});
});

// ---------------------------------------------------------------------------
// shortcutBindingsEqual
// ---------------------------------------------------------------------------
describe('shortcutBindingsEqual', () => {
	it('returns true when all fields match', () => {
		const a: ShortcutBinding = { key: 'k', shift: false, alt: false };
		const b: ShortcutBinding = { key: 'k', shift: false, alt: false };
		expect(shortcutBindingsEqual(a, b)).toBe(true);
	});

	it('returns false when keys differ', () => {
		expect(
			shortcutBindingsEqual(
				{ key: 'k', shift: false, alt: false },
				{ key: 'p', shift: false, alt: false }
			)
		).toBe(false);
	});

	it('returns false when shift differs', () => {
		expect(
			shortcutBindingsEqual(
				{ key: 'k', shift: true, alt: false },
				{ key: 'k', shift: false, alt: false }
			)
		).toBe(false);
	});

	it('returns false when alt differs', () => {
		expect(
			shortcutBindingsEqual(
				{ key: 'k', shift: false, alt: true },
				{ key: 'k', shift: false, alt: false }
			)
		).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// matchesShortcut
// ---------------------------------------------------------------------------
describe('matchesShortcut', () => {
	const binding: ShortcutBinding = { key: 'k', shift: false, alt: false };

	it('matches when metaKey is pressed', () => {
		const event = {
			key: 'k',
			metaKey: true,
			ctrlKey: false,
			shiftKey: false,
			altKey: false
		} as KeyboardEvent;
		expect(matchesShortcut(event, binding)).toBe(true);
	});

	it('matches when ctrlKey is pressed', () => {
		const event = {
			key: 'k',
			metaKey: false,
			ctrlKey: true,
			shiftKey: false,
			altKey: false
		} as KeyboardEvent;
		expect(matchesShortcut(event, binding)).toBe(true);
	});

	it('does not match without meta or ctrl', () => {
		const event = {
			key: 'k',
			metaKey: false,
			ctrlKey: false,
			shiftKey: false,
			altKey: false
		} as KeyboardEvent;
		expect(matchesShortcut(event, binding)).toBe(false);
	});

	it('does not match when shift differs', () => {
		const event = {
			key: 'k',
			metaKey: true,
			ctrlKey: false,
			shiftKey: true,
			altKey: false
		} as KeyboardEvent;
		expect(matchesShortcut(event, binding)).toBe(false);
	});

	it('does not match when alt differs', () => {
		const event = {
			key: 'k',
			metaKey: true,
			ctrlKey: false,
			shiftKey: false,
			altKey: true
		} as KeyboardEvent;
		expect(matchesShortcut(event, binding)).toBe(false);
	});

	it('does not match when key differs', () => {
		const event = {
			key: 'j',
			metaKey: true,
			ctrlKey: false,
			shiftKey: false,
			altKey: false
		} as KeyboardEvent;
		expect(matchesShortcut(event, binding)).toBe(false);
	});

	it('matches shift binding when shiftKey is pressed', () => {
		const shiftBinding: ShortcutBinding = { key: 'p', shift: true, alt: false };
		const event = {
			key: 'p',
			metaKey: true,
			ctrlKey: false,
			shiftKey: true,
			altKey: false
		} as KeyboardEvent;
		expect(matchesShortcut(event, shiftBinding)).toBe(true);
	});

	it('returns false when event key is a modifier-only key', () => {
		const event = {
			key: 'Meta',
			metaKey: true,
			ctrlKey: false,
			shiftKey: false,
			altKey: false
		} as KeyboardEvent;
		expect(matchesShortcut(event, binding)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// getShortcutDisplayParts
// ---------------------------------------------------------------------------
describe('getShortcutDisplayParts', () => {
	it('returns base modifier and uppercase key', () => {
		expect(getShortcutDisplayParts({ key: 'k', shift: false, alt: false })).toEqual([
			'⌘/Ctrl',
			'K'
		]);
	});

	it('includes ⇧ for shift', () => {
		expect(getShortcutDisplayParts({ key: 'p', shift: true, alt: false })).toEqual([
			'⌘/Ctrl',
			'⇧',
			'P'
		]);
	});

	it('includes ⌥/Alt for alt', () => {
		expect(getShortcutDisplayParts({ key: 'n', shift: false, alt: true })).toEqual([
			'⌘/Ctrl',
			'⌥/Alt',
			'N'
		]);
	});

	it('includes both ⇧ and ⌥/Alt', () => {
		expect(getShortcutDisplayParts({ key: 'x', shift: true, alt: true })).toEqual([
			'⌘/Ctrl',
			'⇧',
			'⌥/Alt',
			'X'
		]);
	});

	it('formats multi-character keys like "esc" and "space"', () => {
		expect(getShortcutDisplayParts({ key: 'esc', shift: false, alt: false })).toEqual([
			'⌘/Ctrl',
			'Esc'
		]);
		expect(getShortcutDisplayParts({ key: 'space', shift: false, alt: false })).toEqual([
			'⌘/Ctrl',
			'Space'
		]);
	});
});

// ---------------------------------------------------------------------------
// readShortcutSettings (localStorage interactions)
// ---------------------------------------------------------------------------
describe('readShortcutSettings', () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns defaults when window is undefined', () => {
		vi.stubGlobal('window', undefined);
		const settings = readShortcutSettings();
		expect(settings).toEqual(DEFAULT_SHORTCUTS);
	});

	it('returns defaults when localStorage has no stored value', () => {
		vi.stubGlobal('window', {
			localStorage: { getItem: vi.fn().mockReturnValue(null) }
		});
		const settings = readShortcutSettings();
		expect(settings).toEqual(DEFAULT_SHORTCUTS);
	});

	it('returns defaults when stored JSON is corrupted', () => {
		vi.stubGlobal('window', {
			localStorage: { getItem: vi.fn().mockReturnValue('not-valid-json{{{') }
		});
		const settings = readShortcutSettings();
		expect(settings).toEqual(DEFAULT_SHORTCUTS);
	});

	it('parses valid stored settings', () => {
		const stored = JSON.stringify({
			search: { key: 'j', shift: false, alt: false },
			commandPrompt: { key: 'o', shift: true, alt: false }
		});
		vi.stubGlobal('window', {
			localStorage: { getItem: vi.fn().mockReturnValue(stored) }
		});
		const settings = readShortcutSettings();
		expect(settings.search.key).toBe('j');
		expect(settings.commandPrompt.key).toBe('o');
		expect(settings.commandPrompt.shift).toBe(true);
	});

	it('falls back individual bindings when stored values are invalid', () => {
		const stored = JSON.stringify({
			search: 'not-an-object',
			commandPrompt: { key: 'o', shift: true, alt: false }
		});
		vi.stubGlobal('window', {
			localStorage: { getItem: vi.fn().mockReturnValue(stored) }
		});
		const settings = readShortcutSettings();
		expect(settings.search).toEqual(DEFAULT_SHORTCUTS.search);
		expect(settings.commandPrompt.key).toBe('o');
	});
});

// ---------------------------------------------------------------------------
// updateShortcutSetting
// ---------------------------------------------------------------------------
describe('updateShortcutSetting', () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	it('merges new binding into current settings and writes to localStorage', () => {
		const setItemSpy = vi.fn();
		vi.stubGlobal('window', {
			localStorage: {
				getItem: vi.fn().mockReturnValue(null),
				setItem: setItemSpy
			}
		});

		const newBinding: ShortcutBinding = { key: 'j', shift: false, alt: true };
		const result = updateShortcutSetting('search', newBinding);

		expect(result.search).toEqual(newBinding);
		expect(result.commandPrompt).toEqual(DEFAULT_SHORTCUTS.commandPrompt);
		expect(setItemSpy).toHaveBeenCalledOnce();
	});

	it('returns updated settings object', () => {
		vi.stubGlobal('window', {
			localStorage: {
				getItem: vi.fn().mockReturnValue(null),
				setItem: vi.fn()
			}
		});

		const result = updateShortcutSetting('commandPrompt', { key: 'z', shift: true, alt: true });
		expect(result.commandPrompt.key).toBe('z');
		expect(result.commandPrompt.alt).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// resetShortcutSettings
// ---------------------------------------------------------------------------
describe('resetShortcutSettings', () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	it('writes defaults to localStorage and returns them', () => {
		const setItemSpy = vi.fn();
		vi.stubGlobal('window', {
			localStorage: {
				getItem: vi.fn(),
				setItem: setItemSpy
			}
		});

		const result = resetShortcutSettings();
		expect(result).toEqual(DEFAULT_SHORTCUTS);
		expect(setItemSpy).toHaveBeenCalledOnce();
	});
});

// ---------------------------------------------------------------------------
// DEFAULT_SHORTCUTS
// ---------------------------------------------------------------------------
describe('DEFAULT_SHORTCUTS', () => {
	it('has expected default search binding', () => {
		expect(DEFAULT_SHORTCUTS.search).toEqual({ key: 'k', shift: false, alt: false });
	});

	it('has expected default commandPrompt binding', () => {
		expect(DEFAULT_SHORTCUTS.commandPrompt).toEqual({ key: 'p', shift: true, alt: false });
	});
});
