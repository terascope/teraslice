import { Maybe } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from '../vector';

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

    clone(data = this.data): DateVector {
        return new DateVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
