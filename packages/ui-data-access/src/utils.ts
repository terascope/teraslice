import { UserType } from '@terascope/data-access';
import { DataTypeConfig, AvailableType } from '@terascope/data-types';
import { getField, AnyObject, get, trimAndToLower } from '@terascope/utils';

export function copyField<T extends any, P extends keyof T, V extends T[P]>(to: T, from: T, field: P, defaultVal: V) {
    to[field] = getField(from, field, defaultVal);
}

function testFieldName(field: string) {
    return /^[^.][a-zA-Z0-9-_.]+[^.]$/.test(field);
}
export function validateFieldName(field: any): boolean {
    if (!field) return false;
    if (!testFieldName(field)) return false;
    return !field.includes('..');
}

export function getModelType(model: AnyObject): UserType {
    return get(model, 'type.id', get(model, 'type')) || 'USER';
}

export function parseTypeConfig(typeConfig?: DataTypeConfig, recentlyAdded: string[] = []): ({ field: string; type: AvailableType })[] {
    if (!typeConfig || !typeConfig.fields) return [];

    const alwaysAtBottom: string[] = recentlyAdded.map(trimAndToLower);
    return Object.entries(typeConfig.fields)
        .map(([field, val]) => ({ field, type: val.type, array: val.array }))
        .filter(({ type, field }) => !!type && field !== '__typename')
        .sort((a, b) => {
            const aText = trimAndToLower(a.field);
            const bText = trimAndToLower(b.field);
            if (alwaysAtBottom.includes(aText)) return 1;
            if (aText > bText) {
                return 1;
            }
            if (aText < bText) {
                return -1;
            }
            return 0;
        });
}
