import { GeoShape } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets } from '../interfaces.js';

export class GeoJSONVector extends Vector<GeoShape> {
    toJSONCompatibleValue = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<GeoShape>, options: VectorOptions) {
        super(VectorType.GeoJSON, data, options);
    }
}
