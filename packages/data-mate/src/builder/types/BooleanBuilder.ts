import { coerceToType } from '../type-coercion';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class BooleanBuilder extends Builder<boolean> {
    _valueFrom = coerceToType<boolean>(this.config, this.childConfig);

    constructor(
        data: WritableData<boolean>,
        options: BuilderOptions
    ) {
        super(VectorType.Boolean, data, options);
    }
}
