import { GeoPoint } from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { createObject, WritableData } from '../../core';

import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class GeoPointBuilder extends Builder<GeoPoint> {
    constructor(
        data: WritableData<GeoPoint>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoPoint, data, options);
    }

    _valueFrom(value: unknown): GeoPoint {
        return createObject(
            parseGeoPoint(value as any, true),
        );
    }
}
