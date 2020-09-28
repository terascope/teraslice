import { Vector, VectorOptions } from '../Vector';
import { Data, VectorType } from '../interfaces';

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
