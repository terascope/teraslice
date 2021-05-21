import {
    getTime, getTypeOf, isDateTuple
} from '@terascope/utils';
import { DateTuple } from '@terascope/types';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class DateBuilder extends Builder<DateTuple|number> {
    constructor(
        data: WritableData<DateTuple|number>,
        options: BuilderOptions
    ) {
        super(VectorType.Date, data, options);
    }

    _valueFrom(value: unknown): DateTuple|number {
        if (isDateTuple(value)) return value;

        const epochMillis = getTime(value as any);
        if (epochMillis === false) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a standard date value`);
        }
        return epochMillis;
    }
}
