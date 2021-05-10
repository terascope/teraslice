import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class DateVector extends Vector<number> {
    referenceDate = new Date();
    getComparableValue = undefined;
    valueToJSON = toISO8061;

    constructor(data: DataBuckets<number>, options: VectorOptions) {
        super(VectorType.Date, data, options);
    }
}

function toISO8061(value: number): string {
    return new Date(value).toISOString();
}
