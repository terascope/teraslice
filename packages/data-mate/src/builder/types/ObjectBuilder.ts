import { coerceToType } from '@terascope/core-utils';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class ObjectBuilder<
    T extends Record<string, any> = Record<string, any>
> extends Builder<T> {
    _valueFrom = coerceToType<T>(this.config, this.childConfig);

    constructor(
        data: WritableData<T>,
        options: BuilderOptions
    ) {
        super(VectorType.Object, data, options);
    }
}
