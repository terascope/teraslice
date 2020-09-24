import { GeoPoint } from '@terascope/types';
import { Vector, VectorOptions } from '../vector';
import { VectorType } from '../interfaces';

export class GeoJSONVector extends Vector<GeoPoint> {
    constructor(options: VectorOptions<GeoPoint>) {
        super(VectorType.GeoJSON, options);
    }

    fork(data = this.data): GeoJSONVector {
        return new GeoJSONVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
