import { parseIp } from 'ip-bigint';
import { isIP } from '@terascope/ip-utils';
import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets } from '../interfaces.js';

export class IPVector extends Vector<string> {
    toJSONCompatibleValue = undefined;

    constructor(data: DataBuckets<string>, options: VectorOptions) {
        super(VectorType.IP, data, options);
    }

    getComparableValue(value: string): any {
        if (!isIP(value)) {
            throw new Error(`Invalid IP address: ${value}`);
        }
        return parseIp(value).number;
    }
}
