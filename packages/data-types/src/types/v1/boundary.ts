import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A geo boundary represented as a list of lat/lon points — for example the
 * corners of a bounding box or the vertices of a polygon. Unlike `geo_point`,
 * the coordinates are stored as plain `float` sub-fields rather than a native
 * geo type.
 *
 * - **ES/OpenSearch mapping:** an object with `properties: { lat: { type:
 *   'float' }, lon: { type: 'float' } }`. When `indexed: false` the whole
 *   object is disabled via `enabled: false` (note: `enabled`, not `index`,
 *   because this is an object mapping).
 * - **GraphQL:** a list of a generated object type — `[DTGeoBoundaryV1]` with
 *   `lat: Float!` and `lon: Float!` (an `input` variant is emitted when
 *   `isInput` is set).
 * - **xLucene:** `Geo`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { bounds: { type: 'Boundary' } }
 * };
 */
export default class Boundary extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = {
            properties: {
                lat: { type: 'float' as ESFieldType },
                lon: { type: 'float' as ESFieldType },
            },
        };

        if (this.config.indexed === false) config.enabled = false;

        return {
            mapping: {
                [this.field]: config
            }
        };
    }

    toGraphQL({ isInput }: ToGraphQLOptions = {}): GraphQLType {
        const defType = isInput ? 'input' : 'type';
        const name = this._formatGQLTypeName('GeoBoundary', isInput);
        const customType = `
            ${defType} ${name} {
                lat: Float!
                lon: Float!
            }
        `;
        return this._formatGql(`[${name}]`, customType);
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Geo };
    }
}
