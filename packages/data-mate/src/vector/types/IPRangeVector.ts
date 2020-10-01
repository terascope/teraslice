import { Vector, VectorOptions } from '../Vector';
import { OldData, VectorType } from '../interfaces';

export class IPRangeVector extends Vector<string> {
    constructor(options: VectorOptions<string>) {
        super(VectorType.IPRange, options);
    }

    fork(data: OldData<string>): IPRangeVector {
        return new IPRangeVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
