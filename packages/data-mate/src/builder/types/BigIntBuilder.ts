import { toBigIntOrThrow } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class BigIntBuilder extends Builder<bigint> {
    static valueFrom(value: unknown): bigint {
        return toBigIntOrThrow(value);
    }

    constructor(options: BuilderOptions<bigint>) {
        super(VectorType.BigInt, {
            valueFrom: BigIntBuilder.valueFrom,
            ...options,
        });
    }
}
