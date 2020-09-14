import { GeoPoint } from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

export class GeoPointBuilder extends Builder<GeoPoint> {
    static valueFrom(value: unknown): GeoPoint {
        return parseGeoPoint(value as any, true);
    }

    constructor(options: BuilderOptions<GeoPoint>) {
        super(VectorType.BigInt, {
            valueFrom: GeoPointBuilder.valueFrom,
            ...options,
        });
    }
}
