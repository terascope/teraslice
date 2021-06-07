import { FieldType } from '@terascope/types';
import { coerceToType } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export const INT_SIZES = {
    [FieldType.Byte]: { min: -128, max: 127 },
    [FieldType.Short]: { min: -32_768, max: 32_767 },
    [FieldType.Integer]: { min: -(2 ** 31), max: (2 ** 31) - 1 },
} as const;

export class IntBuilder extends Builder<number> {
    _valueFrom = coerceToType<number>(this.config, this.childConfig);

    constructor(
        data: WritableData<number>,
        options: BuilderOptions
    ) {
        super(VectorType.Int, data, options);
    }
}
