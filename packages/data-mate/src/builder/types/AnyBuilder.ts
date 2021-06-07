import { coerceToType } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class AnyBuilder extends Builder<any> {
    _valueFrom = coerceToType(this.config, this.childConfig);

    constructor(
        data: WritableData<any>,
        options: BuilderOptions
    ) {
        super(VectorType.Any, data, options);
    }
}
