import { toISO8061 } from '@terascope/utils';
import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class DateVector extends Vector<number> {
    referenceDate = new Date();
    getComparableValue = undefined;
    toJSONCompatibleValue = toISO8061;

    constructor(data: DataBuckets<number>, options: VectorOptions) {
        super(VectorType.Date, data, options);
    }
}
