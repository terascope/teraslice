import { coerceToType } from '../type-coercion';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class AnyBuilder extends Builder<any> {
    _valueFrom = coerceToType(this.config, this.childConfig);

    constructor(
        data: WritableData<any>,
        options: BuilderOptions
    ) {
        super(VectorType.Any, data, options);
    }
}
