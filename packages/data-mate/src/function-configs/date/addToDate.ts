import { FieldType } from '@terascope/types';
import {
    joinList, toISO8061, addToDateFP, AdjustDateArgs
} from '@terascope/utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export const addToDateConfig: FieldTransformConfig<AdjustDateArgs> = {
    name: 'addToDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Add time to a date expression or specific number of years, months, weeks, days, hours, minutes, seconds, or milliseconds',
    examples: [{
        args: { expr: '10h+2m' },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        output: new Date('2019-10-23T08:02:00.000Z').getTime(),
        serialize_output: toISO8061
    }, {
        args: { months: 1, minutes: 2 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        output: new Date('2019-11-22T22:02:00.000Z').getTime(),
        serialize_output: toISO8061
    }, {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        fails: true,
        output: 'Expected at least either expr or years, months, weeks, days, hours, minutes, seconds or milliseconds'
    }, {
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
        return addToDateFP(args);
    },
    accepts: [
        FieldType.Date
    ],
    argument_schema: {
        expr: {
            type: FieldType.String,
            description: `The date math expression used to add to the input date.
For example, \`1h\` or \`1h+2m\``
        },
        years: {
            type: FieldType.Integer,
            description: 'The number of years to add to the date. This cannot be specified with expr'
        },
        months: {
            type: FieldType.Integer,
            description: 'The number of months to add to the date. This cannot be specified with expr'
        },
        weeks: {
            type: FieldType.Integer,
            description: 'The number of weeks to add to the date. This cannot be specified with expr'
        },
        days: {
            type: FieldType.Integer,
            description: 'The number of days to add to the date. This cannot be specified with expr'
        },
        hours: {
            type: FieldType.Integer,
            description: 'The number of hours to add to the date. This cannot be specified with expr'
        },
        minutes: {
            type: FieldType.Integer,
            description: 'The number of minutes to add to the date. This cannot be specified with expr'
        },
        seconds: {
            type: FieldType.Integer,
            description: 'The number of seconds to add to the date. This cannot be specified with expr'
        },
        milliseconds: {
            type: FieldType.Integer,
            description: 'The number of milliseconds to add to the date. This cannot be specified with expr'
        }
    },
    validate_arguments(args) {
        const argSchema = this.argument_schema ?? {};
        const keyList = Object.keys(argSchema);
        const argKeys = Object.keys(args);

        if (argKeys.length === 0) {
            throw new Error('Expected at least either expr or years, months, weeks, days, hours, minutes, seconds or milliseconds');
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
    }
};