import { DateFormat } from '@terascope/types';
import { DateValue } from '../../core';
import { WritableData } from '../../data';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';
import { makeCachedValueFrom } from './utils';

export class DateBuilder extends Builder<DateValue> {
    static valueFrom = makeCachedValueFrom((value: unknown, thisArg: DateBuilder): DateValue => {
        if (value instanceof DateValue) return value;

        if (thisArg.config.format) {
            return fromValueWithFormat(
                value,
                thisArg.config.format,
                getReferenceDate(thisArg)
            );
        }

        return DateValue.fromValue(value as any);
    })

    constructor(
        data: WritableData<DateValue>,
        options: BuilderOptions<DateValue>
    ) {
        super(VectorType.Date, data, {
            valueFrom: DateBuilder.valueFrom,
            ...options,
        });
    }
}

const _refDates = new WeakMap<Builder<DateValue>, Date>();
function getReferenceDate(builder: Builder<DateValue>): Date {
    const cached = _refDates.get(builder);
    if (cached) return cached;

    const date = new Date();
    _refDates.set(builder, date);
    return date;
}

function fromValueWithFormat(
    value: any,
    format: DateFormat|string,
    referenceDate: Date
): DateValue {
    if (format && !(format in DateFormat)) {
        if (typeof value !== 'string') {
            throw new Error(`Expected string for formatted date fields, got ${value}`);
        }

        return DateValue.fromValueToFormat(value, format, referenceDate!);
    }

    if (format === DateFormat.epoch) {
        return DateValue.fromValueToEpoch(value);
    }

    return DateValue.fromValue(
        value,
        format as DateFormat.iso_8601|DateFormat.epoch_millis
    );
}
