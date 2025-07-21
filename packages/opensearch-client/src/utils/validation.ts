import type { Client } from '../client/index.js';

export function isValidClient(input: unknown): input is Client {
    if (input == null) return false;
    if (typeof input !== 'object') return false;

    const reqKeys = ['indices', 'index', 'get', 'search'];

    return reqKeys.every((key) => (input as any)[key] != null);
}
