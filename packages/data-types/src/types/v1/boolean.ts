import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class BooleanType extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'boolean' as ESFieldType
                }
            }
        };
    }

    toGraphQL() {
        return this._formatGql('Boolean');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.Boolean };
    }
}
