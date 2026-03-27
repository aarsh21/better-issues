import { describe, expect, it } from 'vitest';

import { TEMPLATE_PRESETS, type TemplatePreset } from './template-presets';

const VALID_FIELD_TYPES = ['text', 'textarea', 'select', 'file', 'url', 'checkbox', 'number'];

describe('TEMPLATE_PRESETS', () => {
	it('is an array with the expected number of presets', () => {
		expect(Array.isArray(TEMPLATE_PRESETS)).toBe(true);
		expect(TEMPLATE_PRESETS).toHaveLength(3);
	});

	it('each preset has name, description, and schema properties', () => {
		for (const preset of TEMPLATE_PRESETS) {
			expect(typeof preset.name).toBe('string');
			expect(preset.name.length).toBeGreaterThan(0);
			expect(typeof preset.description).toBe('string');
			expect(preset.description.length).toBeGreaterThan(0);
			expect(preset.schema).toBeDefined();
			expect(typeof preset.schema).toBe('object');
		}
	});

	it('each schema has a non-empty fields array', () => {
		for (const preset of TEMPLATE_PRESETS) {
			expect(Array.isArray(preset.schema.fields)).toBe(true);
			expect(preset.schema.fields.length).toBeGreaterThan(0);
		}
	});

	it('each field has key, label, and type properties', () => {
		for (const preset of TEMPLATE_PRESETS) {
			for (const field of preset.schema.fields) {
				expect(typeof field.key).toBe('string');
				expect(field.key.length).toBeGreaterThan(0);
				expect(typeof field.label).toBe('string');
				expect(field.label.length).toBeGreaterThan(0);
				expect(typeof field.type).toBe('string');
			}
		}
	});

	it('all field types are valid', () => {
		for (const preset of TEMPLATE_PRESETS) {
			for (const field of preset.schema.fields) {
				expect(VALID_FIELD_TYPES).toContain(field.type);
			}
		}
	});

	it('at least one preset is marked as recommended', () => {
		const recommended = TEMPLATE_PRESETS.filter((p: TemplatePreset) => p.recommended === true);
		expect(recommended.length).toBeGreaterThanOrEqual(1);
	});

	it('contains expected preset names', () => {
		const names = TEMPLATE_PRESETS.map((p: TemplatePreset) => p.name);
		expect(names).toContain('Bug Report');
		expect(names).toContain('Feature Request');
		expect(names).toContain('Incident Report');
	});

	it('field keys are unique within each preset schema', () => {
		for (const preset of TEMPLATE_PRESETS) {
			const keys = preset.schema.fields.map((f) => f.key);
			expect(new Set(keys).size).toBe(keys.length);
		}
	});
});
