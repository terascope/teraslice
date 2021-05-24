import { GeoPoint } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class GeoPointVector extends Vector<GeoPoint> {
    toJSONCompatibleValue = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<GeoPoint>, options: VectorOptions) {
        super(VectorType.GeoPoint, data, options);
    }
}
