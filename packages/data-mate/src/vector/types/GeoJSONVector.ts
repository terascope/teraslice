import { GeoShape } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { Data, VectorType } from '../interfaces';

export class GeoJSONVector extends Vector<GeoShape> {
    constructor(options: VectorOptions<GeoShape>) {
        super(VectorType.GeoJSON, options);
    }

    fork(data: Data<GeoShape>): GeoJSONVector {
        return new GeoJSONVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
