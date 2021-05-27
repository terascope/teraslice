import {
    parseJSON, isNil, joinList, withoutNil
} from '@terascope/utils';
import {
    FieldType, TimeResolution, DataTypeFields, availableFieldTypes
} from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';

// FIXME: what is this doing here???
export interface ParseJSONArgs {
    type?: FieldType;
    array?: boolean;
    description?: string;
    indexed?: boolean;
    locale?: string;
    format?: string;
    is_primary_date?: boolean;
    time_resolution?: TimeResolution;
    child_config?: DataTypeFields
}

export const parseJSONConfig: FieldTransformConfig<ParseJSONArgs> = {
    name: 'parseJSON',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.JSON,
    description: 'Parses a JSON string and returns the value or object according to the arg options.',
    create() {
        return (input: unknown) => {
            if (isNil(input)) return null;
            return parseJSON(input as string);
        };
    },
    accepts: [FieldType.String],
    argument_schema: {
        type: {
            type: FieldType.String,
            description: 'The type of field, defaults to Any, you may need to specify the type for better execution optimization'
        },
        array: {
            type: FieldType.Boolean,
            description: 'Indicates whether the field is an array'
        },

        description: {
            type: FieldType.Text,
            description: 'Set the description for the field'
        },
        locale: {
            type: FieldType.String,
            description: 'Specify the locale for the field (only compatible with some field types).  Must be a BCP 47 Language Tag'
        },

        indexed: {
            type: FieldType.Boolean,
            description: 'Specifies whether the field is indexed in elasticsearch (Only type Object currently support this)'
        },

        format: {
            type: FieldType.String,
            description: 'The format for the field. Currently only supported by Date fields.'
        },
        is_primary_date: {
            type: FieldType.Boolean,
            description: 'Used to denote naming of timeseries indicies, and if any search/join queries off of this field should use a date searching algorithm'
        },
        time_resolution: {
            type: FieldType.String,
            description: 'Indicates whether the data has second or millisecond resolutions used with the `is_primary_date`'
        },
        child_config: {
            type: FieldType.Object,
            description: 'If parsing an object, you can specify the DataTypeFields of the key/values of the object.'
            + ' This is an object whose keys are the name of the fields, whose value is an object with all of the other properties listed above'
            + ' (ie type, array, locale, format but not child_config).'
        }
    },
    validate_arguments(args) {
        if (args && args.child_config) {
            for (const [field, config] of Object.entries(args.child_config)) {
                if (!config.type || !availableFieldTypes.includes(config.type as FieldType)) {
                    throw new Error(`Invalid fieldType for field ${field}, got ${config.type}. Must be set to one from this list: ${joinList(availableFieldTypes as string[])}`);
                }
            }
        }
    },
    output_type(inputConfig: DataTypeFieldAndChildren, args): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        if (args) {
            const { child_config, ...argsConfig } = args;

            return {
                field_config: {
                    ...field_config,
                    type: FieldType.Any,
                    ...withoutNil(argsConfig)
                },
                ...(child_config && { child_config })
            };
        }

        return {
            field_config: {
                ...field_config,
                type: FieldType.Any
            },
        };
    }
};
