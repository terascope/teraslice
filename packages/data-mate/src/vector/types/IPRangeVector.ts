import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { Data } from '../../core-utils';

export class IPRangeVector extends Vector<string> {
    constructor(options: VectorOptions<string>) {
        super(VectorType.IPRange, options);
    }

    fork(data: Data<string>): IPRangeVector {
        return new IPRangeVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
