import { createHash } from 'crypto';
import { toString } from '@terascope/utils';

export const HASH_CODE_SYMBOL = Symbol('__hash__');

export function md5(value: string|Buffer): string {
    return createHash('md5').update(value).digest('hex');
}

export function createKeyForValue(value: unknown): string|undefined {
    if (value == null) return;

    if (typeof value !== 'object') return String(value);

    if (HASH_CODE_SYMBOL in (value as any)) {
        return (value as any)[HASH_CODE_SYMBOL];
    }

    if (Symbol.iterator in (value as any)) {
        let key = '';
        for (const item of value as any[]) {
            if (item != null) key += `${toString(item)}`;
        }
        return key;
    }

    const keys: string[] = Object.keys(value as any).sort();

    let key = '';
    for (const prop of keys) {
        const item = (value as any)[prop];
        if (item != null) {
            key += `${prop}:${toString(item)}`;
        }
    }
    return key;
}

export function createObject<T extends Record<string, any>>(input: T, sort = true): T {
    const result: Record<string, any> = Object.create(null);
    const keys = sort ? Object.keys(input).sort() : Object.keys(input);

    let hash = '';
    const len = keys.length;
    for (let i = 0; i < len; i++) {
        const key = keys[i];
        if (input[key] != null) {
            result[key] = input[key];
            const typeOf = typeof input[key];
            hash += `${key}(${typeOf}):${toString(input[key])};`;
        }
    }

    Object.defineProperty(result, HASH_CODE_SYMBOL, {
        value: md5(hash),
        configurable: false,
        enumerable: false,
        writable: false,
    });

    return Object.freeze({ ...result }) as T;
}
