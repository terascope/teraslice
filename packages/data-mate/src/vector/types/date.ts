import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from '../vector';

/**
 * @todo this should probably be handled better
 */
export class DateVector extends Vector<string> {
    static valueFrom(value: unknown): Maybe<string> {
        if (value == null) return value as Nil;
        return String(value);
    }

    static valueToJSON(value: Maybe<string>): any {
        return value;
    }

    constructor(options: VectorOptions<string>) {
        super(VectorType.Date, {
            valueFrom: DateVector.valueFrom,
            valueToJSON: DateVector.valueToJSON,
            ...options,
        });
    }

    clone(options: VectorOptions<string>): DateVector {
        return new DateVector(options);
    }
}
