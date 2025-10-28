import { coerceToType } from '../type-coercion.js';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class BigIntBuilder extends Builder<bigint> {
    _valueFrom = coerceToType<bigint>(this.config, this.childConfig);

    constructor(
        data: WritableData<bigint>,
        options: BuilderOptions
    ) {
        super(VectorType.BigInt, data, options);
    }
}
