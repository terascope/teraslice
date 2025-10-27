import { toISO8601 } from '@terascope/core-utils';
import { DateTuple } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets } from '../interfaces.js';

export class DateVector extends Vector<DateTuple | number> {
    referenceDate = new Date();
    getComparableValue = getComparableValue;
    toJSONCompatibleValue = toISO8601;

    constructor(data: DataBuckets<DateTuple | number>, options: VectorOptions) {
        super(VectorType.Date, data, options);
    }
}

function getComparableValue(input: DateTuple | number): number {
    if (typeof input === 'number') return input;
    return input[0];
}
