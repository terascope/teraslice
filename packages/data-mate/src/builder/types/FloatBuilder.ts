import { toFloatOrThrow } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class FloatBuilder extends Builder<number> {
    _valueFrom = toFloatOrThrow;

    constructor(
        data: WritableData<number>,
        options: BuilderOptions
    ) {
        super(VectorType.Float, data, options);
    }
}
