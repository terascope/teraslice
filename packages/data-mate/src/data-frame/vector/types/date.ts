import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions } from '../vector';

/**
 * @todo this should probably be handled better
 */
export class DateVector extends Vector<string> {
    static valueFromJSON(value: unknown): Maybe<string> {
        if (value == null) return value as Nil;
        return String(value);
    }

    static valueToJSON(value: Maybe<string>): any {
        return value;
    }

    constructor(options: VectorOptions<string>) {
        super({
            valueFromJSON: DateVector.valueFromJSON,
            valueToJSON: DateVector.valueToJSON,
            ...options,
        });
    }
}
