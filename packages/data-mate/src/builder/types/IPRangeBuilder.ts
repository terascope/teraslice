import validateCIDR from 'is-cidr';
import { getTypeOf, isString } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';
import { WritableData } from '../../core';

function isValidIPRange(input: unknown): input is string {
    if (!isString(input)) return false;
    return validateCIDR(input) > 0;
}

export class IPRangeBuilder extends Builder<string> {
    constructor(
        data: WritableData<string>,
        options: BuilderOptions
    ) {
        super(VectorType.IPRange, data, options);
    }

    _valueFrom(value: unknown): string {
        if (!isValidIPRange(value)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a valid IP range`);
        }
        return value;
    }
}
