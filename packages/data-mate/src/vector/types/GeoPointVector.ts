import { GeoPoint } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class GeoPointVector extends Vector<GeoPoint> {
    valueToJSON = undefined;

    constructor(data: ReadableData<GeoPoint>, options: VectorOptions) {
        super(VectorType.GeoPoint, data, options);
    }
}
