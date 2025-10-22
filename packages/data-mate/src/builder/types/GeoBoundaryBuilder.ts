import { GeoBoundary } from '@terascope/types';
import { coerceToType } from '@terascope/core-utils';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class GeoBoundaryBuilder extends Builder<GeoBoundary> {
    _valueFrom = coerceToType<GeoBoundary>(this.config, this.childConfig);

    constructor(
        data: WritableData<GeoBoundary>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoPoint, data, options);
    }
}
