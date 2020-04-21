import { xLuceneFieldType, ESTypeMapping } from '@terascope/types';
import BaseType from '../base-type';

export default class ObjectType extends BaseType {
    toESMapping(_version?: number) {
        const type = this.config.array ? 'nested' : 'object';
        const typeConfig: ESTypeMapping = { type };
        if (this.config.indexed === false) {
            typeConfig.enabled = false;
        }
        return { mapping: { [this.field]: typeConfig } };
    }

    toGraphQL() {
        return this._formatGql('JSONObject', 'scalar JSONObject');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.Object };
    }
}
