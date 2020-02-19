import { xLuceneFieldType } from '@terascope/types';
import BaseType from '../base-type';
import { ESTypeMapping } from '../../interfaces';

export default class ObjectType extends BaseType {
    toESMapping(_version?: number) {
        const type: ESTypeMapping = { type: 'object' };
        if (this.config.indexed === false) {
            type.enabled = false;
        }
        return { mapping: { [this.field]: type } };
    }

    toGraphQL() {
        return this._formatGql('JSONObject', 'scalar JSONObject');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.Object };
    }
}
