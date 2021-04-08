import { ESGeoShapeType, GeoShape, GeoShapeType } from '@terascope/types';
import { getTypeOf, isGeoJSON, toString } from '@terascope/utils';
import { createObjectValue, WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

const esTypeMap = {
    [ESGeoShapeType.Point]: GeoShapeType.Point,
    [ESGeoShapeType.MultiPolygon]: GeoShapeType.MultiPolygon,
    [ESGeoShapeType.Polygon]: GeoShapeType.Polygon,
} as const;

const weakSet = new WeakSet();

export class GeoJSONBuilder extends Builder<GeoShape> {
    constructor(
        data: WritableData<GeoShape>,
        options: BuilderOptions
    ) {
        super(VectorType.GeoJSON, data, options);
    }

    _valueFrom(value: unknown): GeoShape {
        if (typeof value === 'object' && value != null && weakSet.has(value)) {
            return value as GeoShape;
        }

        if (!isGeoJSON(value)) {
            throw new TypeError(`Expected ${toString(value)} (${getTypeOf(value)}) to be a valid GeoJSON shape`);
        }
        const type = esTypeMap[value.type] ? esTypeMap[value.type] : value.type;

        const result = createObjectValue({ ...value, type }, false);
        weakSet.add(result);
        return result;
    }
}
