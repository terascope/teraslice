import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions } from '../vector';

const maxInt = BigInt(Number.MAX_SAFE_INTEGER);
export function bigIntToJSON(int: bigint): string|number {
    const str = int.toLocaleString('en-US').replace(',', '.');
    if (int < maxInt) return parseInt(str, 10);
    return str;
}

export class BigIntVector extends Vector<bigint> {
    static valueFromJSON(value: unknown): Maybe<bigint> {
        if (value == null) return value as Nil;
        if (typeof value === 'bigint') {
            return value;
        }
        const str = String(value);
        if (str.includes('.')) {
            return BigInt(parseInt(str, 10));
        }
        return BigInt(value);
    }

    static valueToJSON(value: Maybe<bigint>): any {
        if (value == null) return value as Nil;
        return bigIntToJSON(value);
    }

    constructor(options: VectorOptions<bigint>) {
        super({
            valueFromJSON: BigIntVector.valueFromJSON,
            valueToJSON: BigIntVector.valueToJSON,
            ...options,
        });
    }
}
