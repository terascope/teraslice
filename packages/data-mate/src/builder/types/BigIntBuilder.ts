import { toBigInt, getTypeOf } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class BigIntBuilder extends Builder<bigint> {
    static valueFrom(value: unknown): bigint {
        const parsed = toBigInt(value);
        if (parsed === false) {
            throw new TypeError(`Expected ${parsed} (${getTypeOf(value)}) to be a valid BigInt`);
        }
        return parsed;
    }

    constructor(options: BuilderOptions<bigint>) {
        super(VectorType.BigInt, {
            valueFrom: BigIntBuilder.valueFrom,
            ...options,
        });
    }
}
