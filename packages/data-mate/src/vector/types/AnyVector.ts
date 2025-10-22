import { toJSONCompatibleValue as toJSONCompatValue, isNil } from '@terascope/core-utils';
import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets, SerializeOptions } from '../interfaces.js';

export class AnyVector extends Vector<any> {
    getComparableValue = undefined;

    constructor(data: DataBuckets<any>, options: VectorOptions) {
        super(VectorType.Any, data, options);
    }

    toJSONCompatibleValue(value: unknown, options?: SerializeOptions): any {
        const nilValue: any = options?.useNullForUndefined ? null : undefined;
        if (isNil(value)) return nilValue;

        return toJSONCompatValue(value);
    }
}
