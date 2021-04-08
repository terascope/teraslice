import isIP from 'is-ip';
import {
    getTypeOf,
    isString,
    primitiveToString,
} from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';
import { WritableData } from '../../core';

function isValidIP(input: unknown): input is string {
    if (!isString(input)) return false;
    return isIP(input);
}

export class IPBuilder extends Builder<string> {
    constructor(
        data: WritableData<string>,
        options: BuilderOptions
    ) {
        super(VectorType.IP, data, options);
    }

    _valueFrom(value: unknown): string {
        const ipValue = primitiveToString(value);
        if (!isValidIP(ipValue)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a valid IP`);
        }
        return ipValue;
    }
}
