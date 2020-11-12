import { GeoShape } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class GeoJSONVector extends Vector<GeoShape> {
    valueToJSON = undefined;

    constructor(data: ReadableData<GeoShape>, options: VectorOptions) {
        super(VectorType.GeoJSON, data, options);
    }
}
