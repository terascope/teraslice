import { GeoBoundary } from '@terascope/types';
import { coerceToType } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class GeoBoundaryBuilder extends Builder<GeoBoundary> {
    _valueFrom = coerceToType<GeoBoundary>(this.config, this.childConfig);

    constructor(
        data: WritableData<GeoBoundary>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoPoint, data, options);
    }
}
