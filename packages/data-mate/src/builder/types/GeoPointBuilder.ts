import { GeoPoint } from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { createObject } from '../../core-utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class GeoPointBuilder extends Builder<GeoPoint> {
    static valueFrom(value: unknown): GeoPoint {
        return createObject(
            parseGeoPoint(value as any, true),
        );
    }

    isPrimitive = false;

    constructor(options: BuilderOptions<GeoPoint>) {
        super(VectorType.GeoPoint, {
            valueFrom: GeoPointBuilder.valueFrom,
            ...options,
        });
        this.data.isNaturallyDistinct = false;
    }
}
