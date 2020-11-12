import { FieldType } from '@terascope/types';
import { toIntegerOrThrow } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export const INT_SIZES = {
    [FieldType.Byte]: { min: -128, max: 127 },
    [FieldType.Short]: { min: -32_768, max: 32_767 },
    [FieldType.Integer]: { min: -(2 ** 31), max: (2 ** 31) - 1 },
} as const;

export class IntBuilder extends Builder<number> {
    constructor(
        data: WritableData<number>,
        options: BuilderOptions
    ) {
        super(VectorType.Int, data, options);
    }

    valueFrom(value: undefined): number {
        const fieldType = this?.config.type as FieldType|undefined;
        const int = toIntegerOrThrow(value);
        if (fieldType && INT_SIZES[fieldType]) {
            const { max, min } = INT_SIZES[fieldType];
            if (int > max) {
                throw new TypeError(`${int} greater than maximum size of ${max} for ${fieldType}`);
            }
            if (int < min) {
                throw new TypeError(`${int} greater than minimum size of ${min} for ${fieldType}`);
            }
        }
        return int;
    }
}
