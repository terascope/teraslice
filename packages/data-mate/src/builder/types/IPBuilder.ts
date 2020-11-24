import { VectorType } from '../../vector';
import { BuilderOptions } from '../Builder';
import { IPValue, WritableData } from '../../core';
import { BuilderWithCache } from '../BuilderWithCache';

export class IPBuilder extends BuilderWithCache<IPValue> {
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
