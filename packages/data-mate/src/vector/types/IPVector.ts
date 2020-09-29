import { Vector, VectorOptions } from '../Vector';
import { Data, VectorType } from '../interfaces';

export class IPVector extends Vector<string> {
    constructor(options: VectorOptions<string>) {
        super(VectorType.IP, options);
    }

    fork(data: Data<string>): IPVector {
        return new IPVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
