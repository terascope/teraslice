import { GeoPoint } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from '../vector';

export class GeoPointVector extends Vector<GeoPoint> {
    constructor(options: VectorOptions<GeoPoint>) {
        super(VectorType.GeoPoint, options);
    }

    fork(data = this.data): GeoPointVector {
        return new GeoPointVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
