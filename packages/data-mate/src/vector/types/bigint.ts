import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from '../vector';

const maxInt = BigInt(Number.MAX_SAFE_INTEGER);
export function bigIntToJSON(int: bigint): string|number {
    const str = int.toLocaleString('en-US').replace(',', '.');
    if (int < maxInt) return parseInt(str, 10);
    return str;
}

export class BigIntVector extends Vector<bigint> {
    static valueToJSON(value: Maybe<bigint>): any {
        if (value == null) return value as Nil;
        return bigIntToJSON(value);
    }

    constructor(options: VectorOptions<bigint>) {
        super(VectorType.BigInt, {
            valueToJSON: BigIntVector.valueToJSON,
            ...options,
        });
    }

    clone(data = this.data): BigIntVector {
        return new BigIntVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
