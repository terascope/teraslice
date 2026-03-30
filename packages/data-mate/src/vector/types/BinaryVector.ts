import { bufferToString } from '@terascope/core-utils';
import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets } from '../interfaces.js';

export class BinaryVector extends Vector<string> {
    toJSONCompatibleValue = undefined;

    constructor(data: DataBuckets<string>, options: VectorOptions) {
        super(VectorType.Binary, data, options);
    }

    getComparableValue(value: string | Buffer): string {
        return bufferToString(value);
    }
}
