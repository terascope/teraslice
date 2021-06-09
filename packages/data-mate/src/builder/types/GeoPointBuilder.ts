import { GeoPoint } from '@terascope/types';
import { coerceToType } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class GeoPointBuilder extends Builder<GeoPoint> {
    _valueFrom = coerceToType<GeoPoint>(this.config, this.childConfig);

    constructor(
        data: WritableData<GeoPoint>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoPoint, data, options);
    }
}
