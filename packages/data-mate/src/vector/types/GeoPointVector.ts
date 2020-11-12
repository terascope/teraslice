import { GeoPoint } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class GeoPointVector extends Vector<GeoPoint> {
    valueToJSON = undefined;

    constructor(options: VectorOptions<GeoPoint>) {
        super(VectorType.GeoPoint, options);
    }

    fork(data: ReadableData<GeoPoint>): GeoPointVector {
        return new GeoPointVector({
            config: this.config,
            data,
        });
    }
}
