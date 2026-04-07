import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    DateFormat, ESTypeMapping
} from '@terascope/types';
import { withoutNil } from '@terascope/core-utils';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

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
