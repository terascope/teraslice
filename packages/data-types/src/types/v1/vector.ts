import {
    xLuceneFieldType, xLuceneTypeConfig, ClientMetadata,
    ElasticsearchDistribution, ESTypeMapping
} from '@terascope/types';
import { isInteger, isString } from '@terascope/core-utils';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * A dense numeric vector for k-NN / similarity search, stored as an
 * OpenSearch `knn_vector`.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'knn_vector', dimension, method: {
 *   name, engine } }` plus a `settings` block enabling `index.knn: true`. The
 *   `space_type` is placed at the top level for OpenSearch major version >= 3
 *   and inside `method` for earlier versions.
 * - **GraphQL:** `Float`.
 * - **xLucene:** `Float`.
 *
 * Relevant `DataTypeFieldConfig` options:
 * - `array` — **required**; a vector must be declared as an array.
 * - `dimension` — **required**; must be an integer (the vector length).
 * - `space_type` — distance metric; one of `l1`, `l2` (default), `linf`,
 *   `cosinesimil`, `innerproduct`, `hamming`, `hammingbit`.
 * - `name` — algorithm; `hnsw` (default) or `ivf`.
 * - `engine` — `faiss` (default) or `lucene`.
 *
 * Validation (throws from `toESMapping`):
 * - OpenSearch < 2.10 is unsupported.
 * - `array` must be `true`, `dimension` must be an integer, and `space_type`,
 *   `name`, and `engine` must each be valid.
 * - `engine: 'lucene'` cannot be paired with `name: 'ivf'`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: {
 *         embedding: {
 *             type: 'Vector',
 *             array: true,
 *             dimension: 768,
 *             space_type: 'cosinesimil'
 *         }
 *     }
 * };
 */
export default class VectorType extends BaseType {
    toESMapping(config: ClientMetadata): TypeESMapping {
        this._validateESMapping();

        if (!this.config.array) {
            throw new Error('A vector must be marked as an array');
        }

        const { distribution, majorVersion, minorVersion } = config;
        const { dimension, space_type = 'l2', name = 'hnsw', engine = 'faiss' } = this.config;

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
                    },
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
                    },
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

    /**
     * The DuckDB column type for this field.
     */
    toDuckDB(): DuckDBTypeConfig {
        return this._formatDuckDB('DOUBLE');
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
