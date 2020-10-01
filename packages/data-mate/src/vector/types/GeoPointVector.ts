import { GeoPoint } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { Data } from '../../core-utils';

export class GeoPointVector extends Vector<GeoPoint> {
    constructor(options: VectorOptions<GeoPoint>) {
        super(VectorType.GeoPoint, options);
    }

    fork(data: Data<GeoPoint>): GeoPointVector {
        return new GeoPointVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
