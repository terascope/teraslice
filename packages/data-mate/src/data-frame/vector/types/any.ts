import { FieldType, Maybe } from '@terascope/types';
import { Vector } from './base';

export class AnyVector extends Vector<any> {
    constructor(type: FieldType, values: Maybe<any>[]) {
        super(type, values);
    }
}
