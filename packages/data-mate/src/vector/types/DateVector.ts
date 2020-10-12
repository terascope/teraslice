import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { DateValue, ReadableData } from '../../core';

export class DateVector extends Vector<DateValue> {
    static valueToJSON({ value, formatted }: DateValue): string|number {
        return formatted ?? value;
    }

    constructor(options: VectorOptions<DateValue>) {
        super(VectorType.Date, {
            valueToJSON: DateVector.valueToJSON,
            ...options,
        });
    }

    fork(data: ReadableData<DateValue>): DateVector {
        return new DateVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
