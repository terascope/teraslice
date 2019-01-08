import semver from 'semver';
import get from 'lodash.get';
import * as es from 'elasticsearch';
import * as i from './interfaces';

export function isSimpleIndex(input?: i.IndexSchemaConfig): input is i.SimpleIndexSchema {
    return get(input, 'mapping') != null;
}

export function getMajorVersion(input: any): number {
    const v = semver.coerce(input);
    return v != null ? v.major : 1;
}

export function isValidClient(input: any): input is es.Client {
    if (input == null) return false;

    const reqKeys = [
        'indices',
        'index',
        'get',
        'search',
    ];

    return reqKeys.every((key) => input[key] != null);
}

export function isValidConfig(input: any): input is i.IndexConfig {
    if (input == null) return false;
    if (typeof input.index !== 'string') return false;
    if (!input.index) return false;
    return true;
}
