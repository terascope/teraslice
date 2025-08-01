import {
    xLuceneFieldType, xLuceneTypeConfig, ClientMetadata,
    ElasticsearchDistribution, ESTypeMapping
} from '@terascope/types';
import { isInteger, isString } from '@terascope/utils';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class VectorType extends BaseType {
    toESMapping(config: ClientMetadata): TypeESMapping {
        this._validateESMapping();

        if (!this.config.array) {
            throw new Error('A vector must be marked as an array');
        }

        const { distribution, majorVersion, minorVersion } = config;
        const { dimension, space_type = 'l2', name = 'hnsw', engine = 'faiss' } = this.config;

        if (distribution === ElasticsearchDistribution.elasticsearch) {
            throw new Error('Vector datatypes are not supported with Elasticsearch distribution');
        }

        if (distribution === ElasticsearchDistribution.opensearch) {
            if (majorVersion === 1 || (majorVersion === 2 && minorVersion < 10)) {
                throw new Error('Vector datatypes are not supported with Opensearch versions < 2.10');
            }
        }

        if (!isInteger(dimension)) {
            throw new Error(`${this.field} must have a dimension property set to an integer`);
        }

        if (!isValidSpaceType(space_type)) {
            throw new Error(`${this.field} must have a valid space_type property`);
        }

        if (!validAlgorithms(name)) {
            throw new Error(`${this.field} must have a correct name property (the algorithm name)`);
        }

        if (!isValidEngine(engine)) {
            throw new Error(`${this.field} must have a correct engine property`);
        }

        if (engine === 'lucene' && name === 'ivf') {
            throw new Error(`${this.field} has conflicting values, engine "lucene" cannot be paired with name "ivf"`);
        }

        let mapping: {
            [key: string]: ESTypeMapping;
        };

        if (majorVersion >= 3) {
            mapping = {
                [this.field]: {
                    type: 'knn_vector',
                    space_type,
                    dimension,
                    method: {
                        name,
                        engine
                    }
                }
            };
        } else {
            mapping = {
                [this.field]: {
                    type: 'knn_vector',
                    dimension,
                    method: {
                        space_type,
                        name,
                        engine
                    }
                }
            };
        }

        return {
            mapping,
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

const listOfSpaces = ['l1', 'l2', 'linf', 'cosinesimil', 'innerproduct', 'hamming', 'hammingbit'];

function isValidSpaceType(type?: unknown) {
    if (isString(type) && listOfSpaces.includes(type)) return true;
    return false;
}

const listOfEngines = ['lucene', 'faiss'];

function isValidEngine(engine: unknown) {
    if (isString(engine) && listOfEngines.includes(engine)) return true;
    return false;
}

const listOfAlgorithms = ['hnsw', 'ivf'];

function validAlgorithms(algo: unknown) {
    if (isString(algo) && listOfAlgorithms.includes(algo)) return true;
    return false;
}
