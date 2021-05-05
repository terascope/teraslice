import { DateFormat, FieldType, TimeResolution } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';
import { formatDateValue, parseDateValue } from '../../core/date-utils';
import { stringTypes, numericTypes } from '../../core';

export interface ToDateArgs {
    format?: string|DateFormat;
    resolution?: TimeResolution;
}

export const toDateConfig: FieldTransformConfig<ToDateArgs> = {
    name: 'toDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a value to a date value, this can also be used to reformat a date',
    examples: [{
        args: { format: 'yyyy-MM-dd' },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        output: '2019-10-22'
    }, {
        args: { resolution: TimeResolution.SECONDS },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 102390933,
        output: '1973-03-31T01:55:33.000Z'
    }, {
        args: { resolution: TimeResolution.MILLISECONDS },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 102390933000,
        output: '1973-03-31T01:55:33.000Z'
    }, {
        args: { resolution: TimeResolution.MILLISECONDS },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Long } }
        },
        field: 'testField',
        input: 102390933000,
        output: '1973-03-31T01:55:33.000Z'
    }, {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2001-01-01T01:00:00.000Z',
        output: '2001-01-01T01:00:00.000Z'
    }],
    create({ format, resolution }, inputConfig) {
        const inputResolution = inputConfig?.field_config.resolution
            ?? resolution
            ?? TimeResolution.MILLISECONDS;

        let inputFormat: DateFormat|string|undefined = inputConfig?.field_config.format;
        if (!inputFormat) {
            const type = (inputConfig?.field_config?.type as FieldType|undefined) || FieldType.Any;
            if (type === FieldType.Date || stringTypes.has(type)) {
                inputFormat = DateFormat.iso_8601;
            } else if (numericTypes.has(type)) {
                inputFormat = inputResolution === TimeResolution.SECONDS
                    ? DateFormat.epoch : DateFormat.epoch_millis;
            }
        }

        const referenceDate = new Date();
        return function toDate(input: unknown): string|number {
            const parsed = parseDateValue(
                input, inputFormat, referenceDate
            );
            return formatDateValue(parsed, format);
        };
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
        FieldType.Date
    ],
    argument_schema: {
        format: {
            type: FieldType.String,
            description: `When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for number`
        },
        time_resolution: {
            type: FieldType.String,
            description: `This will be set on the field to indicate whether the input date is stored in with millisecond or second accuracy.
This will also change the assumption that numeric input date values are in epoch or epoch_millis time.
Default: milliseconds`
        }
    },
    output_type(inputConfig, { format, resolution }) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                format,
                time_resolution: resolution,
                type: FieldType.Date
            },
        };
    }
};
