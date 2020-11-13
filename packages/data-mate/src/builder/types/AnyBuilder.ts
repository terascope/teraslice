import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class AnyBuilder extends Builder<any> {
    constructor(
        data: WritableData<any>,
        options: BuilderOptions
    ) {
        super(VectorType.Any, data, options);
    }

    _valueFrom(value: unknown): any {
        return value;
    }
}
