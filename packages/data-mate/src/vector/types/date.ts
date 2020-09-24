import { Vector, VectorOptions } from '../vector';
import { VectorType } from '../interfaces';

/**
 * The date stored in epoch milliseconds
*/
export type DateValue = number;

export class DateVector extends Vector<DateValue> {
    /**
     * @todo this should probably be handled better
     */
    static valueToJSON(value: DateValue): number {
        return value;
    }

    constructor(options: VectorOptions<DateValue>) {
        super(VectorType.Date, {
            valueToJSON: DateVector.valueToJSON,
            ...options,
        });
    }

    fork(data = this.data): DateVector {
        return new DateVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
