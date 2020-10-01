import { Vector, VectorOptions } from '../Vector';
import { OldData, VectorType } from '../interfaces';

export class StringVector extends Vector<string> {
    constructor(options: VectorOptions<string>) {
        super(VectorType.String, options);
    }

    fork(data: OldData<string>): StringVector {
        return new StringVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
