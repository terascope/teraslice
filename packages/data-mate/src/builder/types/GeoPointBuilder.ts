import { GeoPoint, GeoPointInput } from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

const weakSet = new WeakSet();
export class GeoPointBuilder extends Builder<GeoPoint> {
    constructor(
        data: WritableData<GeoPoint>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoPoint, data, options);
    }

    _valueFrom(value: unknown): GeoPoint {
        if (typeof value === 'object' && value != null && weakSet.has(value)) {
            return value as GeoPoint;
        }
        const result = Object.freeze(
            parseGeoPoint(value as GeoPointInput, true)
        );
        weakSet.add(result);
        return result;
    }
}
