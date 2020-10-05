import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../data';

export class IPVector extends Vector<string> {
    constructor(options: VectorOptions<string>) {
        super(VectorType.IP, options);
    }

    fork(data: ReadableData<string>): IPVector {
        return new IPVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
