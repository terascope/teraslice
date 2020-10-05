import { GeoPoint } from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { createObject } from '../../core-utils';
import { WritableData } from '../../data';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class GeoPointBuilder extends Builder<GeoPoint> {
    static valueFrom(value: unknown): GeoPoint {
        return createObject(
            parseGeoPoint(value as any, true),
        );
    }

    constructor(
        data: WritableData<GeoPoint>,
        options: BuilderOptions<GeoPoint>
    ) {
        data.isPrimitive = false;
        super(VectorType.GeoPoint, data, {
            valueFrom: GeoPointBuilder.valueFrom,
            ...options,
        });
    }
}
