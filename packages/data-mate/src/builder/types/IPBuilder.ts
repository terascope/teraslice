import { coerceToType } from '@terascope/core-utils';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';
import { WritableData } from '../../core/index.js';

export class IPBuilder extends Builder<string> {
    _valueFrom = coerceToType<string>(this.config, this.childConfig);

    constructor(
        data: WritableData<string>,
        options: BuilderOptions
    ) {
        super(VectorType.IP, data, options);
    }
}
