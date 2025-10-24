import { coerceToType } from '../type-coercion';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class StringBuilder extends Builder<string> {
    _valueFrom = coerceToType<string>(this.config, this.childConfig);

    constructor(
        data: WritableData<string>,
        options: BuilderOptions
    ) {
        super(VectorType.String, data, options);
    }
}
