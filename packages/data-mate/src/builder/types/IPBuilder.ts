import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';
import { IPValue, WritableData } from '../../core';

export class IPBuilder extends Builder<IPValue> {
    constructor(
        data: WritableData<IPValue>,
        options: BuilderOptions
    ) {
        super(VectorType.IP, data, options);
    }

    _valueFrom(value: unknown): IPValue {
        if (value instanceof IPValue) return value;

        return IPValue.fromValue(value as any);
    }
}
