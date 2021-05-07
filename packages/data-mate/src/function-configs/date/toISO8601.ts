import { DateFormat, FieldType, TimeResolution } from '@terascope/types';
import { formatDateValue, parseDateValue } from '@terascope/utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';
import { getInputFormat, isIS8601FieldConfig } from './utils';

export interface ToISO8601Args {
    resolution?: TimeResolution;
}

export const toISO8601Config: FieldTransformConfig<ToISO8601Args> = {
    name: 'toISO8601',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a value to a ISO 8601 date, this is more specific version of toDate(format: "iso_8601")',
    examples: [{
        args: { },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date, format: 'yyyy-MM-dd HH:mm:ss' } }
        },
        field: 'testField',
        input: '2019-10-22 22:20:11',
        output: '2019-10-22T22:20:11.000Z',
        description: 'A previously formatted date should be parsable'
    }, {
        args: { },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
        },
        field: 'testField',
        input: '2019-10-22T01:00:00.000Z',
        output: '2019-10-22T01:00:00.000Z'
    }],
    create(_args, inputConfig) {
        const inputFormat = getInputFormat(inputConfig);
        if (isIS8601FieldConfig(inputConfig)) {
            return noop;
        }

        const referenceDate = new Date();
        return function toISO8601(input: unknown): string|number {
            const parsed = parseDateValue(
                input, inputFormat, referenceDate
            );
            return formatDateValue(parsed, DateFormat.iso_8601);
        };
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
        FieldType.Date
    ],
    argument_schema: {
        time_resolution: {
            type: FieldType.String,
            description: `This will be set on the field to indicate whether the input date is stored in with millisecond or second accuracy.
This will also change the assumption that numeric input date values are in epoch or epoch_millis time.
Default: milliseconds`
        }
    },
    output_type(inputConfig, { resolution }) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                format: DateFormat.iso_8601,
                time_resolution: resolution,
                type: FieldType.Date
            },
        };
    }
};

function noop(input: unknown) {
    return input;
}
