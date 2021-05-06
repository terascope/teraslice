import { FieldType } from '@terascope/types';
import subtract from 'date-fns/sub';
import parser from 'datemath-parser';
import { joinList, formatDateValue, parseDateValue } from '@terascope/utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';
import { getInputFormat } from './utils';

export type SubtractFromDateArgs = {
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

export const subtractFromDateConfig: FieldTransformConfig<SubtractFromDateArgs> = {
    name: 'subtractFromDate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Subtract time from a date expression or specific number of years, months, weeks, days, hours, minutes, seconds, or milliseconds',
    examples: [{
        args: { expr: '10h+2m' },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        output: '2019-10-22T12:02:00.000Z'
    }, {
        args: { months: 1, minutes: 2 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Date } }
        },
        field: 'testField',
        input: '2019-10-22T22:00:00.000Z',
        output: '2019-09-22T21:58:00.000Z'
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
    create(args, inputConfig) {
        const inputFormat = getInputFormat(inputConfig);

        const referenceDate = new Date();
        return function subtractFromDate(input: unknown): string|number {
            const parsed = parseDateValue(
                input, inputFormat, referenceDate
            );

            if ('expr' in args) {
                return formatDateValue(
                    parser.parse(`now-${args.expr}`, new Date(parsed)),
                    inputFormat
                );
            }

            return formatDateValue(
                subtract(parsed, args),
                inputFormat
            );
        };
    },
    accepts: [
        FieldType.Date
    ],
    argument_schema: {
        expr: {
            type: FieldType.String,
            description: `The date math expression used from calculate the date from subtract from.
For example, \`1h\` or \`1h+2m\``
        },
        years: {
            type: FieldType.Integer,
            description: 'The number of years from subtract from the date. This cannot be specified with expr'
        },
        months: {
            type: FieldType.Integer,
            description: 'The number of months from subtract from the date. This cannot be specified with expr'
        },
        weeks: {
            type: FieldType.Integer,
            description: 'The number of weeks from subtract from the date. This cannot be specified with expr'
        },
        days: {
            type: FieldType.Integer,
            description: 'The number of days from subtract from the date. This cannot be specified with expr'
        },
        hours: {
            type: FieldType.Integer,
            description: 'The number of hours from subtract from the date. This cannot be specified with expr'
        },
        minutes: {
            type: FieldType.Integer,
            description: 'The number of minutes from subtract from the date. This cannot be specified with expr'
        },
        seconds: {
            type: FieldType.Integer,
            description: 'The number of seconds from subtract from the date. This cannot be specified with expr'
        },
        milliseconds: {
            type: FieldType.Integer,
            description: 'The number of milliseconds from subtract from the date. This cannot be specified with expr'
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
