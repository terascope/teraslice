import { Vector, VectorOptions } from '../Vector';
import { OldData, VectorType } from '../interfaces';

export class IPVector extends Vector<string> {
    constructor(options: VectorOptions<string>) {
        super(VectorType.IP, options);
    }

    fork(data: OldData<string>): IPVector {
        return new IPVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
