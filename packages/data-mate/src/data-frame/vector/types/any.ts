import { FieldType, Maybe } from '@terascope/types';
import { Vector } from '../vector';

export class AnyVector extends Vector<any> {
    constructor(type: FieldType, values: Maybe<any>[]) {
        super(type, values);
    }
}
