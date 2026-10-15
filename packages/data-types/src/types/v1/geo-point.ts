import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * A latitude/longitude point stored as an Elasticsearch/OpenSearch
 * `geo_point`. Supports geo-distance, bounding-box, and polygon queries.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'geo_point' }`. Honors
 *   `indexed: false` (emitted as `index: false`).
 * - **GraphQL:** a generated object type `DTGeoPointV1` with `lat: String!`
 *   and `lon: String!` (an `input` variant named `DTGeoPointInputV1` is
 *   emitted when `isInput` is set).
 * - **xLucene:** `GeoPoint`.
 *
 * This is the preferred point type; `Geo` is the deprecated equivalent.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { location: { type: 'GeoPoint' } }
 * };
 */
export default class GeoPointType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'geo_point' as ESFieldType };

        if (this.config.indexed === false) config.index = false;

        return {
            mapping: {
                [this.field]: config
            }
        };
    }

    toGraphQL({ isInput }: ToGraphQLOptions = {}): GraphQLType {
        const defType = isInput ? 'input' : 'type';
        const name = this._formatGQLTypeName('GeoPoint', isInput);
        const customType = `
            ${defType} ${name} {
                lat: String!
                lon: String!
            }
        `;
        return this._formatGql(name, customType);
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.GeoPoint };
    }

    /**
     * The DuckDB column type for this field.
     */
    toDuckDB(): DuckDBTypeConfig {
        return this._formatDuckDB('STRUCT(lat DOUBLE, lon DOUBLE)');
    }
}
