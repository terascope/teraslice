import {
    DateFormat, FieldType, ISO8061DateSegment
} from '@terascope/types';
import { trimISODateSegment } from '@terascope/utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';
import { formatDateValue, parseDateValue } from '../../core/date-utils';
import { getInputFormat, isIS8061FieldConfig } from './utils';

export const toYearlyDateConfig: FieldTransformConfig = {
    name: 'toYearlyDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Converts a value to a yearly ISO 8061 date segment',
    examples: [{
        args: { },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date, format: 'yyyy-MM-dd HH:mm:ss' } }
        },
        field: 'testField',
        input: '2019-10-22 22:20:11',
        output: '2019',
        description: 'A previously formatted date should be parsable'
    }, {
        args: { },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date, format: DateFormat.iso_8601 } }
        },
        field: 'testField',
        input: '2019-10-22T01:00:00.000Z',
        output: '2019'
    }],
    create(_args, inputConfig) {
        const inputFormat = getInputFormat(inputConfig);

        const trimFn = trimISODateSegment(ISO8061DateSegment.yearly);
        if (isIS8061FieldConfig(inputConfig)) {
            return trimFn;
        }

        const referenceDate = new Date();
        return function toYearlyDate(input: unknown): string|number {
            const parsed = parseDateValue(
                input, inputFormat, referenceDate
            );
            return trimFn(formatDateValue(parsed, DateFormat.iso_8601));
        };
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
        FieldType.Date
    ],
    argument_schema: {},
    output_type(inputConfig) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                description: field_config.description,
                array: field_config.array,
                type: FieldType.Keyword
            },
        };
    }
};
