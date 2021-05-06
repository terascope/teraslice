import { DateFormat, FieldType, TimeResolution } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';
import { formatDateValue, parseDateValue } from '../../core/date-utils';
import { stringTypes, numericTypes } from '../../core';

export interface ToISO8061Args {
    resolution?: TimeResolution;
}

export const toISO8061Config: FieldTransformConfig<ToISO8061Args> = {
    name: 'toISO8061',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a value to a to ISO 8061 date, this is more specific version of toDate(format: "iso_8061")',
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
    create({ resolution }, inputConfig) {
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

        if (
            inputConfig?.field_config?.type === FieldType.Date && (
                inputConfig.field_config.format === DateFormat.iso_8601
                || inputConfig.field_config.format == null
            )
        ) {
            return noop;
        }

        const referenceDate = new Date();
        return function toISO8061(input: unknown): string|number {
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
