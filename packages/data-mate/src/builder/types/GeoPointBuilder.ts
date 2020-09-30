import { GeoPoint } from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { createObject } from '../../core-utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class GeoPointBuilder extends Builder<GeoPoint> {
    static valueFrom(value: unknown): GeoPoint {
        return createObject(
            parseGeoPoint(value as any, true),
            false // there is no need to sort because we know it will be sorted
        );
    }

    isPrimitive = false;

    constructor(options: BuilderOptions<GeoPoint>) {
        super(VectorType.GeoPoint, {
            valueFrom: GeoPointBuilder.valueFrom,
            ...options,
        });
    }
}
