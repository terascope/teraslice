import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * An IP range stored as an Elasticsearch/OpenSearch `ip_range` field. Accepts
 * CIDR notation (e.g. `10.0.0.0/24`) and matches queries whose address falls
 * within the stored range.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'ip_range' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `String`.
 * - **xLucene:** `IPRange`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { subnet: { type: 'IPRange' } }
 * };
 */
export default class IpRangeType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'ip_range' as ESFieldType };

        if (this.config.indexed === false) config.index = false;

        return {
            mapping: {
                [this.field]: config
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.IPRange };
    }
}
