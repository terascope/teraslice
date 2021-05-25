import { GeoShape } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class GeoJSONVector extends Vector<GeoShape> {
    toJSONCompatibleValue = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<GeoShape>, options: VectorOptions) {
        super(VectorType.GeoJSON, data, options);
    }
}
