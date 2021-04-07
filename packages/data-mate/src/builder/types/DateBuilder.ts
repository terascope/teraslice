import {
    getTypeOf, isNumber, isString, isValidDateInstance, makeISODate
} from '@terascope/utils';
import { DateFormat } from '@terascope/types';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class DateBuilder extends Builder<number|string> {
    constructor(
        data: WritableData<number>,
        options: BuilderOptions
    ) {
        super(VectorType.Date, data, options);
    }

    _valueFrom(value: unknown): number|string {
        if (value instanceof Date) {
            if (isValidDateInstance(value)) return value.toISOString();

            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a valid date instance`);
        }

        if (!isString(value) && !isNumber(value)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a valid date`);
        }

        // ensure we stored the iso 8601 format where possible
        if (this.config.format === DateFormat.iso_8601 || !this.config.format) {
            return makeISODate(value);
        }

        return value;
    }
}
