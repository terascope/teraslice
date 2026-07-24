import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    DateFormat, ESTypeMapping
} from '@terascope/types';
import { withoutNil } from '@terascope/core-utils';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A date/time value stored as an Elasticsearch/OpenSearch `date`.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'date' }`, optionally with a `format`.
 *   The `config.format` is only carried through to ES when it is a custom
 *   (non-`DateFormat`) pattern or an epoch format; `DateFormat.seconds` is
 *   normalized to `epoch` and `DateFormat.milliseconds` to `epoch_millis`,
 *   since ES only understands `epoch`/`epoch_millis`. When no usable format
 *   is present the `format` key is dropped (via `withoutNil`). Honors
 *   `indexed: false` (emitted as `index: false`).
 * - **GraphQL:** `String` (ISO-8601 date strings).
 * - **xLucene:** `Date`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { created: { type: 'Date' } }
 * };
 */
export default class DateType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();
        let format: string | undefined;

        if (this.config.format && (
            !(this.config.format in DateFormat)
            || this.config.format === DateFormat.epoch
            || this.config.format === DateFormat.seconds
            || this.config.format === DateFormat.epoch_millis
            || this.config.format === DateFormat.milliseconds
        )
        ) {
            format = this.config.format as string;
        }

        // es only supports epoch and epoch_millis
        if (format === DateFormat.milliseconds) {
            format = DateFormat.epoch_millis;
        }
        if (format === DateFormat.seconds) {
            format = DateFormat.epoch;
        }

        const config: ESTypeMapping = withoutNil({
            type: 'date' as ESFieldType,
            format,
        });

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
        return { [this.field]: xLuceneFieldType.Date };
    }
}
