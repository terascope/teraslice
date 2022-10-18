import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class KeywordPathAnalyzer extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
        if (this.config.indexed === false) {
            throw new Error(`${this.constructor.name} is required to be indexed`);
        }
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword' as ESFieldType,
                    fields: {
                        tokens: {
                            type: 'text',
                            analyzer: 'path_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                path_analyzer: {
                    type: 'custom',
                    tokenizer: 'path_tokenizer'
                }
            },
            tokenizer: {
                path_tokenizer: {
                    type: 'pattern',
                    pattern: '/'
                }
            },
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.String };
    }
}
