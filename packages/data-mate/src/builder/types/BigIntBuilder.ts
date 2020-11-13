import { toBigIntOrThrow } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class BigIntBuilder extends Builder<bigint> {
    _valueFrom = toBigIntOrThrow;

    constructor(
        data: WritableData<bigint>,
        options: BuilderOptions
    ) {
        super(VectorType.BigInt, data, options);
    }
}
