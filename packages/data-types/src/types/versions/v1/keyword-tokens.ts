
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class KeywordTokens extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword' as ElasticSearchTypes,
                    fields: {
                        tokens: {
                            type: 'text',
                            index: 'true',
                            analyzer: 'simple'
                        }
                    }
                }
            }
        };
    }

    toGraphQl() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'keyword' };
    }
}
