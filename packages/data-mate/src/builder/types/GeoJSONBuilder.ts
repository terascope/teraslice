import { ESGeoShapeType, GeoShape, GeoShapeType } from '@terascope/types';
import { getTypeOf, isGeoJSON, toString } from '@terascope/utils';
import { createObject } from '../../core';
import { WritableData } from '../../data';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

const esTypeMap = {
    [ESGeoShapeType.Point]: GeoShapeType.Point,
    [ESGeoShapeType.MultiPolygon]: GeoShapeType.MultiPolygon,
    [ESGeoShapeType.Polygon]: GeoShapeType.Polygon,
};
export class GeoJSONBuilder extends Builder<GeoShape> {
    static valueFrom(value: unknown): GeoShape {
        if (!isGeoJSON(value)) {
            throw new TypeError(`Expected ${toString(value)} (${getTypeOf(value)}) to be a valid GeoJSON shape`);
        }
        const type = esTypeMap[value.type] ? esTypeMap[value.type] : value.type;
        return createObject({ ...value, type });
    }

    constructor(
        data: WritableData<GeoShape>,
        options: BuilderOptions<GeoShape>
    ) {
        super(VectorType.GeoJSON, data, {
            valueFrom: GeoJSONBuilder.valueFrom,
            ...options,
        });
    }
}
