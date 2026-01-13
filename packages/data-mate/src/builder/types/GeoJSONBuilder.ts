import { GeoShape } from '@terascope/types';
import { coerceToType } from '../type-coercion.js';
import { WritableData } from '../../core/index.js';
import { VectorType } from '../../vector/index.js';
import { Builder, BuilderOptions } from '../Builder.js';

export class GeoJSONBuilder extends Builder<GeoShape> {
    _valueFrom = coerceToType<GeoShape>(this.config, this.childConfig);

    constructor(
        data: WritableData<GeoShape>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoJSON, data, options);
    }
}
