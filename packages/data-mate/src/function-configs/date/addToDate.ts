import { FieldType } from '@terascope/types';
import add from 'date-fns/add';
import parser from 'datemath-parser';
import {
    joinList, getValidDate, getTypeOf
} from '@terascope/utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export type AddToDateArgs = {
    readonly expr: string;
}|{
    readonly years?: number;
    readonly months?: number;
    readonly weeks?: number;
    readonly days?: number;
    readonly hours?: number;
    readonly minutes?: number;
    readonly seconds?: number;
    readonly milliseconds?: number;
}

export const addToDateConfig: FieldTransformConfig<AddToDateArgs> = {
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
        output: new Date('2019-10-23T08:02:00.000Z').getTime()
    }, {
        args: { months: 1, minutes: 2 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        output: new Date('2019-11-22T22:02:00.000Z').getTime()
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
    create(args) {
        return function addToDate(input: unknown): number {
            const date = getValidDate(input as any);
            if (date === false) {
                throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be a standard date value`);
            }

            if ('expr' in args) {
                return parser.parse(`now+${args.expr}`, date);
            }

            return add(date, args).valueOf();
        };
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
        const argKeys = Object.keys(args);
        if ('expr' in args && argKeys.length > 1) {
            const withoutExpr = argKeys.filter((k) => k !== 'expr');
            throw new Error(`Invalid use of ${joinList(withoutExpr)} with expr parameter`);
        }

        if (argKeys.length === 0) {
            throw new Error('Expected at least either expr or years, months, weeks, days, hours, minutes, seconds or milliseconds');
        }
    }
};
