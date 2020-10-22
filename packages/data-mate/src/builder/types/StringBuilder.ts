import { primitiveToString } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class StringBuilder extends Builder<string> {
    static valueFrom = primitiveToString;

    constructor(
        data: WritableData<string>,
        options: BuilderOptions<string>
    ) {
        super(VectorType.String, data, {
            valueFrom: StringBuilder.valueFrom,
            ...options,
        });
    }
}
