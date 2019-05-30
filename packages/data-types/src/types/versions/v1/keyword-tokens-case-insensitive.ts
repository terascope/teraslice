
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class KeywordTokensCaseInsensitive extends BaseType {

    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    // TODO: this is wrong, I dont think analyzer can be at this level
                    type: 'text' as ElasticSearchTypes,
                    analyzer: 'lowercase_keyword_analyzer',
                    fields: {
                        tokens: {
                            type: 'text' as ElasticSearchTypes,
                            analyzer: 'simple'
                        }
                    }
                }
            },
            analyzer: {
                lowercase_keyword_analyzer: {
                    tokenizer: 'keyword',
                    filter: 'lowercase'
                },
            }
        };
    }

    toGraphQl() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'text' };
    }
}
