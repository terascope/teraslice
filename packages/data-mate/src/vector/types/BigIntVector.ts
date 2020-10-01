import { bigIntToJSON } from '@terascope/utils';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { Data } from '../../core-utils';

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

    fork(data: Data<bigint>): BigIntVector {
        return new BigIntVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
