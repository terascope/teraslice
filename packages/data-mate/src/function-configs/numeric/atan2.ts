import { FieldType } from '@terascope/types';
import { getTypeOf, isNumberLike, toFloatOrThrow } from '@terascope/core-utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { isArrayColumn } from './sql-utils.js';
import { finiteOrNull } from '../sql-helpers.js';

export const atan2Config: FieldTransformConfig = {
    name: 'atan2',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the angle in the plane (in radians) between the positive x-axis and the ray from (0,0) to the point (x,y), for atan2(y,x)',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: [15, 90],
            output: 1.4056476493802699
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: [90, 15],
            output: 0.16514867741462683
        },
        {
            args: {},
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte, array: true } }
            },
            field: 'testField',
            input: [-90, null],
            fails: true,
            output: 'Expected (x, y) coordinates, got [-90,null] (Array)'
        }
    ],
    create() {
        return atan2;
    },
    /**
     * `atan2(y, x)` from a two-element coordinate list - note the ARGUMENT ORDER.
     *
     * `getCoordinates` destructures `[x, y]` and then calls `Math.atan2(y, x)`, so the list's
     * SECOND element is the first argument. DuckDB's lists are 1-indexed. Reversed, this returns a
     * plausible wrong angle rather than an error.
     *
     * `approximate` for the usual transcendental reason.
    */
    sql: {
        approximate: true,
        applies: isArrayColumn,
        expression: ({ value }) => finiteOrNull(`atan2(${value}[2], ${value}[1])`),
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                array: false,
                type: FieldType.Float
            }
        };
    }
};

function atan2(input: unknown): number | null {
    if (input == null) return null;

    const [x, y] = getCoordinates(input);

    const value = Math.atan2(y, x);
    if (value === Number.NEGATIVE_INFINITY
        || value === Number.POSITIVE_INFINITY
        || Number.isNaN(value)) {
        return null;
    }
    return value;
}

function getCoordinates(input: unknown): [x: number, y: number] {
    if (
        !Array.isArray(input)
        || input.length !== 2
        || !(isNumberLike(input[0]) && isNumberLike(input[1]))
    ) {
        throw new TypeError(`Expected (x, y) coordinates, got ${JSON.stringify(input)} (${getTypeOf(input)})`);
    }
    return [toFloatOrThrow(input[0]), toFloatOrThrow(input[1])];
}
