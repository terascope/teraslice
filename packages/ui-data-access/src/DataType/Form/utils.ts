import { TypeConfig } from 'xlucene-evaluator';
import { availableDataTypes } from '../interfaces';
import { trimAndToLower } from '@terascope/utils';

export function validateFieldType(type: any): boolean {
    if (!type) return true;
    return availableDataTypes.includes(type);
}

export function parseTypeConfig(typeConfig?: TypeConfig): ({ field: string; type: string })[] {
    if (!typeConfig) return [];

    return Object.entries(typeConfig)
        .map(([field, type]) => ({ field, type }))
        .filter(({ type }) => !!type)
        .sort((a, b) => {
            const aText = trimAndToLower(a.field);
            const bText = trimAndToLower(b.field);
            if (aText > bText) {
                return 1;
            }
            if (aText < bText) {
                return -1;
            }
            return 0;
        });
}
