import {
    xLuceneFieldType, xLuceneTypeConfig, ClientMetadata,
    ElasticsearchDistribution
} from '@terascope/types';
import { isInteger, isString } from '@terascope/utils';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

// TODO: maybe validate not elasticsearch 6 or other versions that don't support
export default class VectorType extends BaseType {
    toESMapping(config: ClientMetadata): TypeESMapping {
        this._validateESMapping();

        if (this.config.array == false) {
            throw new Error('A vector must be marked as an array');
        }

        const { distribution, majorVersion } = config;

        const { dimension, space_type = 'l2', name = 'hnsw' } = this.config;

        if (!isInteger(dimension)) {
            throw new Error(`${this.field} must have an dimension property set to an integer`);
        }

        if (!isValidSpaceType(space_type)) {
            throw new Error(`${this.field} must have an dimension property set to an integer`);
        }

        const mapping: Record<string, Record<string, any>> = {
            [this.field]: {
                type: 'knn_vector',
                dimension,
            }
        };

        if (distribution === ElasticsearchDistribution.opensearch) {
            if (majorVersion === 3) {
                mapping[this.field].space_type = space_type;
            } else {
                mapping[this.field].method = {
                    space_type,
                    name
                };
            }
        } else {
            throw new Error('Vector support currently on works with opensearch')
        }

        return {
            mapping: {
                [this.field]: {
                    type: 'knn_vector',
                    dimension,
                    space_type
                }
            },
            settings: {
                'index.knn': true
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('Float');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Float };
    }
}

// TODO:This may need to be put somewhere else for definitions
const listOfSpaces = ['l1', 'l2', 'linf', 'cosinesimil', 'innerproduct', 'hamming', 'hammingbit'];

function isValidSpaceType(type?: unknown) {
    if (isString(type) && listOfSpaces.includes(type)) return true;
    return false;
}
