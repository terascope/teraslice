import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig, DateFormat
} from '@terascope/types';
import { withoutNil } from '@terascope/utils';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class DateType extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
        let format: string|undefined;

        if (this.config.format && (
            !(this.config.format in DateFormat)
            || this.config.format === DateFormat.epoch_millis
        )
        ) {
            format = this.config.format as string;
        }

        return {
            mapping: {
                [this.field]: withoutNil({
                    type: 'date' as ESFieldType,
                    format
                })
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
