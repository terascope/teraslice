import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';
import { DateValue } from '../../core';

export class DateVector extends Vector<DateValue> {
    getComparableValue = undefined;

    constructor(data: DataBuckets<DateValue>, options: VectorOptions) {
        super(VectorType.Date, data, options);
    }

    valueToJSON({ value, formatted }: DateValue): string|number {
        return formatted ?? value;
    }
}
