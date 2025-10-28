import { coerceToType } from '../type-coercion.js';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class FloatBuilder extends Builder<number> {
    _valueFrom = coerceToType<number>(this.config, this.childConfig);

    constructor(
        data: WritableData<number>,
        options: BuilderOptions
    ) {
        super(VectorType.Float, data, options);
    }
}
