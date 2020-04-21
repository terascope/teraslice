import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class Text extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'text' as ESFieldType } } };
    }

    toGraphQL() {
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.String };
    }
}
