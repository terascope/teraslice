import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

export class AnyBuilder extends Builder<any> {
    constructor(options: BuilderOptions<any>) {
        super(VectorType.Any, options);
    }
}
