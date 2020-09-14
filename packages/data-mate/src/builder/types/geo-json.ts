import { ESGeoShapeType, GeoShape, GeoShapeType } from '@terascope/types';
import { isGeoJSON, toString } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

const typeMap = {
    [ESGeoShapeType.Point]: GeoShapeType.Point,
    [ESGeoShapeType.MultiPolygon]: GeoShapeType.MultiPolygon,
    [ESGeoShapeType.Polygon]: GeoShapeType.Polygon,
};
export class GeoJSONBuilder extends Builder<GeoShape> {
    static valueFrom(value: unknown): GeoShape {
        if (!isGeoJSON(value)) {
            throw new TypeError(`Expected ${toString(value)} to be a valid GeoJSON shape`);
        }
        value.type = typeMap[value.type];
        return value as GeoShape;
    }

    constructor(options: BuilderOptions<GeoShape>) {
        super(VectorType.GeoJSON, {
            valueFrom: GeoJSONBuilder.valueFrom,
            ...options,
        });
    }
}
