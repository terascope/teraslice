import { FieldType } from '@terascope/types';
import {
    joinList, toISO8601, subtractFromDateFP, AdjustDateArgs
} from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

// AdjustDateArgs is not export as addFromDate does so, cannot double export

export const subtractFromDateConfig: FieldTransformConfig<AdjustDateArgs> = {
    name: 'subtractFromDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input date minus the date expression or a specific number of years, months, weeks, days, hours, minutes, seconds, or milliseconds',
    examples: [{
        args: { expr: '10h+2m' },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        output: new Date('2019-10-22T12:02:00.000Z').getTime(),
        serialize_output: toISO8601
    },
    {
        args: { expr: '10h+2m' },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: [1571781600000, 60],
        output: new Date('2019-10-22T13:02:00.000Z').getTime(),
        serialize_output: toISO8601,
        test_only: true,
    },
    {
        args: { months: 1, minutes: 2 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        output: new Date('2019-09-22T21:58:00.000Z').getTime(),
        serialize_output: toISO8601
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        fails: true,
        output: 'Expected an expr or years, months, weeks, days, hours, minutes, seconds or milliseconds'
    },
    {
        args: { expr: '1hr', months: 10 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        fails: true,
        output: 'Invalid use of months with expr parameter'
    }],
    create({ args }) {
        return subtractFromDateFP(args);
    },
    accepts: [FieldType.Date],
    argument_schema: {
        expr: {
            type: FieldType.String,
            description: `The date math expression used to subtract from the input date.
For example, \`1h\` or \`1h+2m\``
        },
        years: {
            type: FieldType.Integer,
            description: 'The number of years to subtract from the date. This cannot be specified with expr'
        },
        months: {
            type: FieldType.Integer,
            description: 'The number of months to subtract from the date. This cannot be specified with expr'
        },
        weeks: {
            type: FieldType.Integer,
            description: 'The number of weeks to subtract from the date. This cannot be specified with expr'
        },
        days: {
            type: FieldType.Integer,
            description: 'The number of days to subtract from the date. This cannot be specified with expr'
        },
        hours: {
            type: FieldType.Integer,
            description: 'The number of hours to subtract from the date. This cannot be specified with expr'
        },
        minutes: {
            type: FieldType.Integer,
            description: 'The number of minutes to subtract from the date. This cannot be specified with expr'
        },
        seconds: {
            type: FieldType.Integer,
            description: 'The number of seconds to subtract from the date. This cannot be specified with expr'
        },
        milliseconds: {
            type: FieldType.Integer,
            description: 'The number of milliseconds to subtract from the date. This cannot be specified with expr'
        }
    },
    validate_arguments(args) {
        const argSchema = this.argument_schema ?? {};
        const keyList = Object.keys(argSchema);
        const argKeys = Object.keys(args);

        if (argKeys.length === 0) {
            throw new Error('Expected an expr or years, months, weeks, days, hours, minutes, seconds or milliseconds');
        }

        for (const argKey of argKeys) {
            if (!keyList.includes(argKey)) {
                throw new Error(`Invalid arg name ${argKey}, must be one of ${joinList(keyList)}`);
            }
        }

        if ('expr' in args && argKeys.length > 1) {
            const withoutExpr = argKeys.filter((k) => k !== 'expr');
            throw new Error(`Invalid use of ${joinList(withoutExpr)} with expr parameter`);
        }
    },
    output_type(inputConfig) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                description: field_config.description,
                array: field_config.array,
                type: FieldType.Date
            },
        };
    }
};
