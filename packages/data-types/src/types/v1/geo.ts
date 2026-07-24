import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

// TODO: This type is deprecated, not sure how to properly indicate it.
/**
 * @deprecated Use {@link GeoPointType} (`GeoPoint`) instead.
 *
 * A latitude/longitude point stored as an Elasticsearch/OpenSearch
 * `geo_point`. This is the legacy geo type, kept for backwards compatibility;
 * it is identical to `GeoPoint` at the ES/GraphQL level and differs only in
 * its xLucene type.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'geo_point' }`. Honors
 *   `indexed: false` (emitted as `index: false`).
 * - **GraphQL:** a generated object type `DTGeoPointV1` with `lat: String!`
 *   and `lon: String!` (an `input` variant is emitted when `isInput` is set).
 * - **xLucene:** `Geo`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { location: { type: 'Geo' } }
 * };
 */
export default class GeoType extends BaseType {
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
        return { [this.field]: xLuceneFieldType.Geo };
    }
}
