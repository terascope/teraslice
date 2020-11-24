import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import {
    ColumnTransformConfig, TransformMode, TransformType
} from '../interfaces';

export type CastArgs = Partial<DataTypeFieldConfig>;
/**
 * Converts a field into a specific type
 *
 * @example
 *
 *     cast(type: "Keyword") // current type: 'Integer', array: false
 *       // 1000 => '1000'
 *
 *     cast(array: true) // current type: 'Keyword', array: false
 *       // 'example' => ['example']
 */
export const castConfig: ColumnTransformConfig<any, any, CastArgs> = {
    type: TransformType.TRANSFORM,
    create(_vector, args) {
        return {
            mode: TransformMode.NONE,
            output: { ...args },
        };
    },
    description: 'Converts a field into a specific type',
    argument_schema: {
        type: {
            type: FieldType.String,
            description: 'The type of field to cast to'
        },
        array: {
            type: FieldType.Boolean,
            description: 'Indicates whether the field should be transformed to array'
        },
        description: {
            type: FieldType.Text,
            description: 'A new description for the field'
        },
        locale: {
            type: FieldType.String,
            description: `Specify the locale for the field (only compatible with some field types).
Must be represented in a Language Tags (BCP 47)`
        },
        format: {
            type: FieldType.String,
            description: 'The format for the field. Currently only Date field support it.'
        },
    },
    accepts: [],
    output: undefined,
};
