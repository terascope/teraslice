import { ESGeoShapeType, GeoShape, GeoShapeType } from '@terascope/types';
import { getTypeOf, isGeoJSON, toString } from '@terascope/utils';
import { createObjectValue, WritableData } from '../../core';
import { VectorType } from '../../vector';
import { BuilderOptions } from '../Builder';
import { BuilderWithCache } from '../BuilderWithCache';

const esTypeMap = {
    [ESGeoShapeType.Point]: GeoShapeType.Point,
    [ESGeoShapeType.MultiPolygon]: GeoShapeType.MultiPolygon,
    [ESGeoShapeType.Polygon]: GeoShapeType.Polygon,
} as const;

export class GeoJSONBuilder extends BuilderWithCache<GeoShape> {
    constructor(
        data: WritableData<GeoShape>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoJSON, data, options);
    }

    _valueFrom(value: unknown): GeoShape {
        if (!isGeoJSON(value)) {
            throw new TypeError(`Expected ${toString(value)} (${getTypeOf(value)}) to be a valid GeoJSON shape`);
        }
        const type = esTypeMap[value.type] ? esTypeMap[value.type] : value.type;
        return createObjectValue({ ...value, type }, false);
    }
}
