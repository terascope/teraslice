import { Vector, VectorOptions } from '../Vector';
import { Data, VectorType } from '../interfaces';
import { DateValue } from './DateValue';

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

    fork(data: Data<DateValue>): DateVector {
        return new DateVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
