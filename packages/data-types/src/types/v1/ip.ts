import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * An IPv4 or IPv6 address stored as an Elasticsearch/OpenSearch `ip` field,
 * enabling CIDR-range queries.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'ip' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `String`.
 * - **xLucene:** `IP`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { client_ip: { type: 'IP' } }
 * };
 */
export default class IPType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'ip' as ESFieldType };

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
        return { [this.field]: xLuceneFieldType.IP };
    }
}
