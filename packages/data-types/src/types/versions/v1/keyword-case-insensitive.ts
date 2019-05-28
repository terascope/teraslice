
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class KeywordCaseInsensitive extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    // TODO: this is wrong, I dont think analyzer can be at this level
                    type: 'text' as ElasticSearchTypes,
                    analyzer: 'lowercase_keyword_analyzer'
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
