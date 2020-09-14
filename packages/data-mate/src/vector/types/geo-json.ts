import { GeoPoint } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from '../vector';

export class GeoJSONVector extends Vector<GeoPoint> {
    constructor(options: VectorOptions<GeoPoint>) {
        super(VectorType.GeoJSON, options);
    }

    fork(data = this.data): GeoJSONVector {
        return new GeoJSONVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
