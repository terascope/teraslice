import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { DateValue, ReadableData } from '../../core';

export class DateVector extends Vector<DateValue> {
    constructor(data: ReadableData<DateValue>, options: VectorOptions) {
        super(VectorType.Date, data, options);
    }

    valueToJSON({ value, formatted }: DateValue): string|number {
        return formatted ?? value;
    }
}
