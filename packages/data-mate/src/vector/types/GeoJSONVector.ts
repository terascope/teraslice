import { GeoShape } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { OldData, VectorType } from '../interfaces';

export class GeoJSONVector extends Vector<GeoShape> {
    constructor(options: VectorOptions<GeoShape>) {
        super(VectorType.GeoJSON, options);
    }

    fork(data: OldData<GeoShape>): GeoJSONVector {
        return new GeoJSONVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
