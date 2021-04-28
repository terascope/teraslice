import { FieldType } from '@terascope/types';
import { FieldTransformConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export interface SplitStringArgs {
    delimiter: string;
}

export const splitStringConfig: FieldTransformConfig<SplitStringArgs> = {
    name: 'splitString',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: ' Converts a string to an array of characters split by the delimiter provided, defaults to splitting up every char',
    create({ delimiter = '' }) {
        return (input: unknown) => splitFn(input as string, delimiter);
    },
    accepts: [FieldType.String],
    argument_schema: {
        delimiter: {
            type: FieldType.String,
            array: false,
            description: 'The char used to identify where to split the string'
        }
    },
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                array: true,
            }
        };
    }
};

function splitFn(input: string, delimiter: string) {
    input.split(delimiter);
}
