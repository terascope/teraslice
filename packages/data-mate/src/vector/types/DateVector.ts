import { Vector, VectorOptions } from '../Vector';
import { OldData, VectorType } from '../interfaces';
import { DateValue } from '../../core-utils';

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

    fork(data: OldData<DateValue>): DateVector {
        return new DateVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
