import { isIP as checkIP } from 'net';
import { getTypeOf, isString } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';
import { WritableData } from '../../core';

function isValidIP(input: unknown): input is string {
    if (!isString(input)) return false;
    if (checkIP(input) === 0) return false;

    // needed to check for inputs like - '::192.168.1.18'
    if (input.includes(':') && input.includes('.')) return false;

    return true;
}

export class IPBuilder extends Builder<string> {
    static valueFrom(value: unknown): string {
        if (!isValidIP(value)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a valid IP`);
        }
        return value;
    }

    constructor(
        data: WritableData<string>,
        options: BuilderOptions<string>
    ) {
        super(VectorType.IP, data, {
            valueFrom: IPBuilder.valueFrom,
            ...options,
        });
    }
}
