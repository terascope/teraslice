import { coerceToType } from '@terascope/utils';
import { DateTuple } from '@terascope/types';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class DateBuilder extends Builder<DateTuple|number> {
    _valueFrom = coerceToType<DateTuple|number>(this.config, this.childConfig);

    constructor(
        data: WritableData<DateTuple|number>,
        options: BuilderOptions
    ) {
        super(VectorType.Date, data, options);
    }
}
