import { bigIntToJSON } from '@terascope/utils';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class BigIntVector extends Vector<bigint> {
    valueToJSON = bigIntToJSON;

    constructor(data: ReadableData<bigint>, options: VectorOptions) {
        super(VectorType.BigInt, data, options);
    }
}
