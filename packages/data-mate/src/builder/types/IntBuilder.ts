import { coerceToType } from '@terascope/utils';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class IntBuilder extends Builder<number> {
    _valueFrom = coerceToType<number>(this.config, this.childConfig);

    constructor(
        data: WritableData<number>,
        options: BuilderOptions
    ) {
        super(VectorType.Int, data, options);
    }
}
