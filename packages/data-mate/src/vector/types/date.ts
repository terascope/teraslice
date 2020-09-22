import { Maybe } from '@terascope/types';
import { Vector, VectorOptions } from '../vector';
import { VectorType } from '../interfaces';

/**
 * @todo this should probably be handled better
 */
export class DateVector extends Vector<string> {
    static valueToJSON(value: Maybe<string>): any {
        return value;
    }

    constructor(options: VectorOptions<string>) {
        super(VectorType.Date, {
            valueToJSON: DateVector.valueToJSON,
            ...options,
        });
    }

    fork(data = this.data): DateVector {
        return new DateVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
