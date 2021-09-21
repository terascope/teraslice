import { GeoBoundary } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class GeoBoundaryVector extends Vector<GeoBoundary> {
    toJSONCompatibleValue = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<GeoBoundary>, options: VectorOptions) {
        super(VectorType.GeoBoundary, data, options);
    }
}
