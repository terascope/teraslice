import { FieldType } from '@terascope/types';
import { TSError, coerceToType } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class TupleBuilder<T extends [...any] = [...any]> extends Builder<T> {
    _valueFrom = coerceToType<T>(this.config, this.childConfig);

    constructor(
        data: WritableData<T>,
        options: BuilderOptions
    ) {
        super(VectorType.Tuple, data, options);
        if (!this.childConfig || !Object.keys(this.childConfig).length) {
            throw new TSError(`${FieldType.Tuple} field types require at least one field`, {
                context: { safe: true },
                statusCode: 400
            });
        }
    }
}
