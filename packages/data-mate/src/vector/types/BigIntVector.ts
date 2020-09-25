import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';

const maxInt = BigInt(Number.MAX_SAFE_INTEGER);
export function bigIntToJSON(int: bigint): string|number {
    const str = int.toLocaleString('en-US').replace(/,/g, '');
    if (int < maxInt) return parseInt(str, 10);
    return str;
}

export class BigIntVector extends Vector<bigint> {
    static valueToJSON(value: bigint): any {
        return bigIntToJSON(value);
    }

    constructor(options: VectorOptions<bigint>) {
        super(VectorType.BigInt, {
            valueToJSON: BigIntVector.valueToJSON,
            ...options,
        });
    }

    fork(data = this.data): BigIntVector {
        return new BigIntVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
