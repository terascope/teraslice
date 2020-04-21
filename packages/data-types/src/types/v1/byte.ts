import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class Byte extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'byte' as ESFieldType } } };
    }

    toGraphQL() {
        return this._formatGql('Int');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.Integer };
    }
}
