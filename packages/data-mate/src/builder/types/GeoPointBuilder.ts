import { GeoPoint } from '@terascope/types';
import { coerceToType } from '../type-coercion';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class GeoPointBuilder extends Builder<GeoPoint> {
    _valueFrom = coerceToType<GeoPoint>(this.config, this.childConfig);

    constructor(
        data: WritableData<GeoPoint>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoPoint, data, options);
    }
}
