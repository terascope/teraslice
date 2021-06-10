import { coerceToType } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class BooleanBuilder extends Builder<boolean> {
    _valueFrom = coerceToType<boolean>(this.config, this.childConfig);

    constructor(
        data: WritableData<boolean>,
        options: BuilderOptions
    ) {
        super(VectorType.Boolean, data, options);
    }
}
