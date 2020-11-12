import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { DateValue, ReadableData } from '../../core';

export class DateVector extends Vector<DateValue> {
    constructor(options: VectorOptions<DateValue>) {
        super(VectorType.Date, options);
    }

    fork(data: ReadableData<DateValue>): DateVector {
        return new DateVector({
            config: this.config,
            data,
        });
    }

    valueToJSON({ value, formatted }: DateValue): string|number {
        return formatted ?? value;
    }
}
