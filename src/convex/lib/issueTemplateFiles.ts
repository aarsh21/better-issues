import type { Id } from '../_generated/dataModel';

import { parseTemplateSchema } from './templateSchema';

type TemplateFileValue = {
	storageId: Id<'_storage'>;
	fileName: string;
	fileType: string;
	fileSize: number;
};

function isTemplateFileValue(candidate: unknown): candidate is TemplateFileValue {
	if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
		return false;
	}

	const record = candidate as {
		storageId?: unknown;
		fileName?: unknown;
		fileType?: unknown;
		fileSize?: unknown;
	};

	return (
		typeof record.storageId === 'string' &&
		record.storageId.length > 0 &&
		typeof record.fileName === 'string' &&
		record.fileName.length > 0 &&
		typeof record.fileType === 'string' &&
		typeof record.fileSize === 'number' &&
		Number.isFinite(record.fileSize) &&
		record.fileSize >= 0
	);
}

export function collectTemplateStorageIds(
	templateSchemaJson: string | null | undefined,
	templateDataJson: string | null | undefined
): Set<Id<'_storage'>> {
	if (!templateSchemaJson || !templateDataJson) {
		return new Set();
	}

	try {
		const parsedTemplateData = JSON.parse(templateDataJson) as unknown;
		if (
			!parsedTemplateData ||
			typeof parsedTemplateData !== 'object' ||
			Array.isArray(parsedTemplateData)
		) {
			return new Set();
		}

		const schema = parseTemplateSchema(templateSchemaJson);
		const data = parsedTemplateData as Record<string, unknown>;
		const storageIds = new Set<Id<'_storage'>>();

		for (const field of schema.fields) {
			if (field.type !== 'file') {
				continue;
			}

			const fieldValue = data[field.key];
			const allowsMultiple = field.multiple !== false;

			if (allowsMultiple) {
				if (!Array.isArray(fieldValue)) {
					continue;
				}

				for (const value of fieldValue) {
					if (isTemplateFileValue(value)) {
						storageIds.add(value.storageId);
					}
				}
				continue;
			}

			if (isTemplateFileValue(fieldValue)) {
				storageIds.add(fieldValue.storageId);
			}
		}

		return storageIds;
	} catch {
		return new Set();
	}
}
