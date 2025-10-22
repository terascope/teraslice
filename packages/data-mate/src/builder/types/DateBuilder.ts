import { coerceToType } from '@terascope/core-utils';
import { DateTuple } from '@terascope/types';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class DateBuilder extends Builder<DateTuple | number> {
    _valueFrom = coerceToType<DateTuple | number>(this.config, this.childConfig);

    constructor(
        data: WritableData<DateTuple | number>,
        options: BuilderOptions
    ) {
        super(VectorType.Date, data, options);
    }
}
