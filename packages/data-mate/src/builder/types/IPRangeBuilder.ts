import { coerceToType } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';
import { WritableData } from '../../core';

export class IPRangeBuilder extends Builder<string> {
    _valueFrom = coerceToType<string>(this.config, this.childConfig);

    constructor(
        data: WritableData<string>,
        options: BuilderOptions
    ) {
        super(VectorType.IPRange, data, options);
    }
}
