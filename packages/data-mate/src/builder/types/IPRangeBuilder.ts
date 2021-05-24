import { getTypeOf, isCIDR } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';
import { WritableData } from '../../core';

export class IPRangeBuilder extends Builder<string> {
    constructor(
        data: WritableData<string>,
        options: BuilderOptions
    ) {
        super(VectorType.IPRange, data, options);
    }

    _valueFrom(value: unknown): string {
        if (!isCIDR(value)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a valid IP range`);
        }
        return value;
    }
}
