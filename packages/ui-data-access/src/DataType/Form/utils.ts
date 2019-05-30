import { TypeConfig } from 'xlucene-evaluator';
import { availableDataTypes } from '../interfaces';

export function validateFieldName(field: any): boolean {
    if (!field) return false;
    return /^[a-zA-Z0-9-_.]+$/.test(field);
}

export function validateFieldType(type: any): boolean {
    if (!type) return true;
    return availableDataTypes.includes(type);
}

export function parseTypeConfig(typeConfig?: TypeConfig): ({ field: string; type: string })[] {
    if (!typeConfig) return [];

    return Object.entries(typeConfig)
        .map(([field, type]) => ({ field, type }))
        .filter(({ type }) => !!type);
}

export function validateTypeConfig(typeConfig?: TypeConfig): boolean {
    return parseTypeConfig(typeConfig).some(({ field, type }) => {
        // if valid return false
        if (validateFieldName(field)) return false;
        if (validateFieldType(type)) return false;
        // else return true
        return true;
    });
}
