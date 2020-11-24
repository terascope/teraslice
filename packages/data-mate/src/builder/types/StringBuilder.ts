import { primitiveToString } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class StringBuilder extends Builder<string> {
    _valueFrom = primitiveToString;

    constructor(
        data: WritableData<string>,
        options: BuilderOptions
    ) {
        super(VectorType.String, data, options);
    }
}
