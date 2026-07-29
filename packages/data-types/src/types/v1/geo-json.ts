import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ClientMetadata, ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A GeoJSON geometry (point, polygon, or multi-polygon) stored as an
 * Elasticsearch/OpenSearch `geo_shape`, enabling shape-relation queries
 * (intersects, within, contains, disjoint).
 *
 * - **ES/OpenSearch mapping:** `{ type: 'geo_shape' }`. Unlike most types this
 *   cannot be excluded from indexing — `GeoJSON` is in `indexedRequiredFieldTypes`,
 *   so `indexed: false` will throw.
 * - **GraphQL:** a `GeoJSON` custom scalar (the `scalar GeoJSON` definition is
 *   emitted alongside the field).
 * - **xLucene:** `GeoJSON`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { region: { type: 'GeoJSON' } }
 * };
 */
export default class GeoJSON extends BaseType {
    toESMapping(_clientMetaData: ClientMetadata): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'geo_shape' as ESFieldType };

        return {
            mapping: {
                [this.field]: config
            }
        };
    }

    // TODO: need notion of injecting custom types, what about duplicates
    toGraphQL(): GraphQLType {
        return this._formatGql('GeoJSON', 'scalar GeoJSON');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.GeoJSON };
    }
}
