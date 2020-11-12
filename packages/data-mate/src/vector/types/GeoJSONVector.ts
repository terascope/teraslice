import { GeoShape } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class GeoJSONVector extends Vector<GeoShape> {
    valueToJSON = undefined;

    constructor(options: VectorOptions<GeoShape>) {
        super(VectorType.GeoJSON, options);
    }

    fork(data: ReadableData<GeoShape>): GeoJSONVector {
        return new GeoJSONVector({
            config: this.config,
            data,
        });
    }
}
