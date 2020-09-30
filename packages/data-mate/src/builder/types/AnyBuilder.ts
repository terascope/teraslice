import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class AnyBuilder extends Builder<any> {
    isPrimitive = true;

    constructor(options: BuilderOptions<any>) {
        super(VectorType.Any, options);
    }
}
