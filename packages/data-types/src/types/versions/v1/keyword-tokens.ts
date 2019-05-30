
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class KeywordTokens extends BaseType {

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
