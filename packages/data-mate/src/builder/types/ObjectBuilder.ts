import { coerceToType } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { BuilderOptions } from '../Builder';
import { BuilderWithCache } from '../BuilderWithCache';

export class ObjectBuilder<
    T extends Record<string, any> = Record<string, any>
> extends BuilderWithCache<T> {
    _valueFrom = coerceToType<T>(this.config, this.childConfig);

    constructor(
        data: WritableData<T>,
        options: BuilderOptions
    ) {
        super(VectorType.Object, data, options);
    }
}
