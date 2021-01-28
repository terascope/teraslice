import { GeoPoint } from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { createObjectValue, WritableData } from '../../core';
import { VectorType } from '../../vector';
import { BuilderOptions } from '../Builder';
import { BuilderWithCache } from '../BuilderWithCache';

export class GeoPointBuilder extends BuilderWithCache<GeoPoint> {
    constructor(
        data: WritableData<GeoPoint>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoPoint, data, options);
    }

    _valueFrom(value: unknown): GeoPoint {
        return createObjectValue(
            parseGeoPoint(value as any, true),
            false,
        );
    }
}
