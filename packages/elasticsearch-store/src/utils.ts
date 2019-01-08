import semver from 'semver';
import get from 'lodash.get';
import { IndexSchemaConfig, SimpleIndexSchema } from './interfaces';

export function isSimpleIndex(input?: IndexSchemaConfig): input is SimpleIndexSchema {
    return get(input, 'mapping') != null;
}

export function getMajorVersion(input: any): number {
    const v = semver.coerce(input);
    return v != null ? v.major : 1;
}
