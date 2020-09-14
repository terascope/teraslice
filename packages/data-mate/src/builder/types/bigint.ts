import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

export class BigIntBuilder extends Builder<bigint> {
    static valueFrom(value: unknown): bigint {
        if (typeof value === 'bigint') {
            return value;
        }
        const str = String(value);
        if (str.includes('.')) {
            return BigInt(parseInt(str, 10));
        }
        return BigInt(value);
    }

    constructor(options: BuilderOptions<bigint>) {
        super(VectorType.BigInt, {
            valueFrom: BigIntBuilder.valueFrom,
            ...options,
        });
    }
}
