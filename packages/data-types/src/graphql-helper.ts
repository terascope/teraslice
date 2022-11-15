import { trim } from '@terascope/utils';
import { buildSchema, printSchema } from 'graphql';

export function formatSchema(schemaStr: string, removeScalars = false): string {
    const schema = buildSchema(schemaStr, {
        commentDescriptions: true,
    });
    const result = printSchema(schema, {
        commentDescriptions: true
    });

    if (removeScalars) {
        return result.replace(/\s*scalar \w+/g, '');
    }
    return result;
}

export function formatGQLComment(desc?: string, prefix?: string): string {
    let description = trim(desc);
    if (prefix) {
        description = description ? `${prefix} - ${description}` : prefix;
    }
    if (!description) return '';

    return description
        .split('\n')
        .map((str) => trim(str).replace(/^#/, '').trim())
        .filter(Boolean)
        .map((str) => `# ${str}`)
        .join('\n');
}
