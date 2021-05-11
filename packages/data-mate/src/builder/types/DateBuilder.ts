import {
    getTime, getTypeOf
} from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class DateBuilder extends Builder<number> {
    constructor(
        data: WritableData<number>,
        options: BuilderOptions
    ) {
        super(VectorType.Date, data, options);
    }

    _valueFrom(value: unknown): number {
        const epochMillis = getTime(value as any);
        if (epochMillis === false) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a standard date value`);
        }
        return epochMillis;
    }
}
