import { GeoPoint } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { OldData, VectorType } from '../interfaces';

export class GeoPointVector extends Vector<GeoPoint> {
    constructor(options: VectorOptions<GeoPoint>) {
        super(VectorType.GeoPoint, options);
    }

    fork(data: OldData<GeoPoint>): GeoPointVector {
        return new GeoPointVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
