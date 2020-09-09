import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions } from '../vector';

export class BigIntVector extends Vector<bigint> {
    static serialize(value: unknown): Maybe<bigint> {
        if (value == null) return value as Nil;
        if (typeof value === 'bigint') {
            return value;
        }
        return BigInt(value);
    }

    static deserialize(value: Maybe<BigInt>): any {
        if (value == null) return value as Nil;
        // FIXME
        return value.toString();
    }

    constructor(options: VectorOptions<bigint>) {
        super({
            serialize: BigIntVector.serialize,
            deserialize: BigIntVector.deserialize,
            ...options,
        });
    }
}
