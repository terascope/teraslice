import { WritableData } from '../../data';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class AnyBuilder extends Builder<any> {
    constructor(
        data: WritableData<any>,
        options: BuilderOptions<any>
    ) {
        data.isPrimitive = false;
        super(VectorType.Any, data, options);
    }
}
