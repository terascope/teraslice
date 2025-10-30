import { trim } from '@terascope/core-utils';
import { buildSchema, printSchema } from 'graphql/utilities/index.js';

export function formatSchema(schemaStr: string, removeScalars = false): string {
    const schema = buildSchema(schemaStr);
    const result = printSchema(schema!);

    if (removeScalars) {
        return result.replace(/\s*scalar \w+/g, '');
    }
    return result;
}

export function formatGQLDescription(desc?: string, prefix?: string): string {
    let description = trim(desc);
    if (prefix) {
        description = description ? `${prefix} - ${description}` : prefix;
    }
    if (!description) return '';

    const trimmedLines = description
        .split('\n')
        .map((str) => str.trim())
        .filter(Boolean)
        .map((str) => `${str}`);

    if (trimmedLines.length > 1) {
        return `"""${trimmedLines.join('\n')}"""`;
    }
    return `""" ${trimmedLines[0]} """`;
}
