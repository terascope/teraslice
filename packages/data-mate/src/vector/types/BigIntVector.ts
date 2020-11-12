import { bigIntToJSON } from '@terascope/utils';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class BigIntVector extends Vector<bigint> {
    valueToJSON = bigIntToJSON;

    constructor(options: VectorOptions<bigint>) {
        super(VectorType.BigInt, options);
    }

    fork(data: ReadableData<bigint>): BigIntVector {
        return new BigIntVector({
            config: this.config,
            data,
        });
    }
}
