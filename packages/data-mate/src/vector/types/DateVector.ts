import { toISO8061 } from '@terascope/utils';
import { DateTuple } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class DateVector extends Vector<DateTuple|number> {
    referenceDate = new Date();
    getComparableValue = getComparableValue;
    valueToJSON = dateTupleToISO81;

    constructor(data: DataBuckets<DateTuple|number>, options: VectorOptions) {
        super(VectorType.Date, data, options);
    }
}

function dateTupleToISO81(input: DateTuple|number): string {
    if (typeof input === 'number') return toISO8061(input);
    if (input[1] === 0) return toISO8061(input[0]);
    return toISO8061(input[0]).replace('Z', genTimezone(input[0]));
}

function genTimezone(offset: number): string {
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset - (hours * 60);

    const sign = offset < 0 ? '-' : '+';
    return `${sign}${pad(hours)}:${pad(minutes)}`;
}

function pad(input: number): string {
    return input < 10 ? `0${input}` : `${input}`;
}

function getComparableValue(input: DateTuple|number): number {
    if (typeof input === 'number') return input;
    return input[0];
}
