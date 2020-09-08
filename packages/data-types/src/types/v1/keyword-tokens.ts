import { xLuceneFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class KeywordTokens extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword',
                    fields: {
                        tokens: {
                            type: 'text',
                            analyzer: 'standard',
                        },
                    },
                },
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
