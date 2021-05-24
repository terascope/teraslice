import { FieldType } from '@terascope/types';
import { toIntegerOrThrow, validateNumberType } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export const INT_SIZES = {
    [FieldType.Byte]: { min: -128, max: 127 },
    [FieldType.Short]: { min: -32_768, max: 32_767 },
    [FieldType.Integer]: { min: -(2 ** 31), max: (2 ** 31) - 1 },
} as const;

export class IntBuilder extends Builder<number> {
    // this is only here because typescript cant
    // differentiate between an instance and a prototype
    _valueFrom = toIntegerOrThrow;

    constructor(
        data: WritableData<number>,
        options: BuilderOptions
    ) {
        super(VectorType.Int, data, options);
        this._valueFrom = validateNumberType(this.config.type as FieldType);
    }
}
